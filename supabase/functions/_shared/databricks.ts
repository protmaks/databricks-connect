// Shared helper: run a SQL statement against Databricks via Lovable connector gateway.
// Uses statement-execution API and polls until SUCCEEDED.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/databricks";
const DEFAULT_WAREHOUSE_ID = "b1032b820d2ffe19";

export interface SqlParam {
  name: string;
  value: string | number | boolean | null;
  type?: string; // e.g. "STRING", "INT", "DOUBLE"
}

export interface SqlResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

function getEnv(): { lovable: string; dbx: string; warehouse: string } {
  const lovable = Deno.env.get("LOVABLE_API_KEY");
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  const dbx = Deno.env.get("DATABRICKS_API_KEY_1") ?? Deno.env.get("DATABRICKS_API_KEY");
  if (!dbx) throw new Error("DATABRICKS_API_KEY_1 is not configured");
  const warehouse = Deno.env.get("DATABRICKS_WAREHOUSE_ID") ?? DEFAULT_WAREHOUSE_ID;
  return { lovable, dbx, warehouse };
}

function headers(lovable: string, dbx: string) {
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": dbx,
    "Content-Type": "application/json",
  };
}

// In-memory LRU + TTL cache shared across requests served by the same edge instance.
// Edge instances live for several minutes between cold-starts, so this absorbs
// most repeated SQL traffic without any external infra.
const CACHE_TTL_MS = Number(Deno.env.get("CACHE_TTL_SECONDS") ?? "300") * 1000;
const CACHE_MAX = 100;
type CacheEntry = { value: SqlResult; expires: number };
const sqlCache = new Map<string, CacheEntry>();

function cacheKey(statement: string, params: SqlParam[]): string {
  return JSON.stringify({ s: statement, p: params });
}

function cacheGet(key: string): SqlResult | null {
  const hit = sqlCache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    sqlCache.delete(key);
    return null;
  }
  // refresh LRU position
  sqlCache.delete(key);
  sqlCache.set(key, hit);
  return hit.value;
}

function cacheSet(key: string, value: SqlResult): void {
  if (sqlCache.size >= CACHE_MAX) {
    const oldest = sqlCache.keys().next().value;
    if (oldest) sqlCache.delete(oldest);
  }
  sqlCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

export async function runSql(
  statement: string,
  params: SqlParam[] = [],
  rowLimit = 5000,
  options: { cache?: boolean } = {},
): Promise<SqlResult> {
  const useCache = options.cache !== false;
  const key = cacheKey(statement, params);
  if (useCache) {
    const cached = cacheGet(key);
    if (cached) {
      console.log("[databricks] cache HIT", statement.slice(0, 60).replace(/\s+/g, " "));
      return cached;
    }
  }

  const { lovable, dbx, warehouse } = getEnv();
  const h = headers(lovable, dbx);

  const body: Record<string, unknown> = {
    statement,
    warehouse_id: warehouse,
    wait_timeout: "30s",
    on_wait_timeout: "CONTINUE",
    disposition: "INLINE",
    format: "JSON_ARRAY",
    row_limit: rowLimit,
  };
  if (params.length) {
    body.parameters = params.map((p) => ({
      name: p.name,
      value: p.value === null ? null : String(p.value),
      type: p.type ?? "STRING",
    }));
  }

  async function safeJson(res: Response): Promise<unknown> {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // Gateway sometimes returns plain text like "upstream connect error..." on 5xx.
      throw new Error(`Databricks gateway non-JSON [${res.status}]: ${text.slice(0, 300)}`);
    }
  }

  async function submitOnce(): Promise<{ res: Response; data: any }> {
    const res = await fetch(`${GATEWAY_URL}/2.0/sql/statements`, {
      method: "POST",
      headers: h,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await safeJson(res).catch((e) => ({ _err: (e as Error).message }));
      throw new Error(`Databricks submit failed [${res.status}]: ${JSON.stringify(data)}`);
    }
    const data = await safeJson(res);
    return { res, data: data as any };
  }

  // Retry submit on transient gateway failures (502/503/504 / non-JSON).
  let initial: any;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const out = await submitOnce();
      initial = out.data;
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      const msg = (e as Error).message;
      const transient = /\b(502|503|504)\b/.test(msg) || /non-JSON/.test(msg) || /upstream/i.test(msg);
      if (!transient) throw e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  if (!initial) throw lastErr ?? new Error("Databricks submit failed");

  let current = initial;
  const id = current.statement_id;
  let safety = 30;
  while (current.status?.state && current.status.state !== "SUCCEEDED" && safety-- > 0) {
    const state = current.status.state;
    if (state === "FAILED" || state === "CANCELED" || state === "CLOSED") {
      throw new Error(`Databricks statement ${state}: ${JSON.stringify(current.status?.error ?? current.status)}`);
    }
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(`${GATEWAY_URL}/2.0/sql/statements/${id}`, { headers: h });
    if (!poll.ok) {
      const data = await safeJson(poll).catch((e) => ({ _err: (e as Error).message }));
      throw new Error(`Databricks poll failed [${poll.status}]: ${JSON.stringify(data)}`);
    }
    current = await safeJson(poll) as any;
  }

  if (current.status?.state !== "SUCCEEDED") {
    throw new Error(`Databricks not finished: ${JSON.stringify(current.status)}`);
  }

  const schema = current.manifest?.schema?.columns ?? [];
  const columns: string[] = schema.map((c: { name: string }) => c.name);

  // Collect first chunk + follow next_chunk_internal_link until exhausted.
  const allData: unknown[][] = [...(current.result?.data_array ?? [])];
  let nextLink: string | undefined = current.result?.next_chunk_internal_link;
  let chunkSafety = 50;
  while (nextLink && chunkSafety-- > 0) {
    // next_chunk_internal_link is a path like /api/2.0/sql/statements/{id}/result/chunks/{n}
    const url = nextLink.startsWith("http")
      ? nextLink
      : `${GATEWAY_URL}${nextLink.replace(/^\/api/, "")}`;
    const chunkRes = await fetch(url, { headers: h });
    if (!chunkRes.ok) {
      const data = await safeJson(chunkRes).catch((e) => ({ _err: (e as Error).message }));
      throw new Error(`Databricks chunk failed [${chunkRes.status}]: ${JSON.stringify(data)}`);
    }
    const chunk = await safeJson(chunkRes) as any;
    if (Array.isArray(chunk?.data_array)) allData.push(...chunk.data_array);
    nextLink = chunk?.next_chunk_internal_link;
  }

  const rows = allData.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
  console.log(`[databricks] fetched ${rows.length} rows`);
  const result: SqlResult = { columns, rows };
  if (useCache) {
    cacheSet(key, result);
    console.log("[databricks] cache MISS, cached", statement.slice(0, 60).replace(/\s+/g, " "));
  }
  return result;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

export function errorResponse(error: unknown, status = 500): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Edge function error:", error);
  return jsonResponse({ error: message }, status);
}
