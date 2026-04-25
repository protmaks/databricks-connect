// Shared helper: run a SQL statement against Databricks via Lovable connector gateway.
// Uses statement-execution API and polls until SUCCEEDED.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/databricks";
const DEFAULT_WAREHOUSE_ID = "5c76d84b9c61f80d";

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
  const dbx = Deno.env.get("DATABRICKS_API_KEY");
  if (!dbx) throw new Error("DATABRICKS_API_KEY is not configured");
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

export async function runSql(statement: string, params: SqlParam[] = [], rowLimit = 5000): Promise<SqlResult> {
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

  const submit = await fetch(`${GATEWAY_URL}/2.0/sql/statements`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(body),
  });
  const initial = await submit.json();
  if (!submit.ok) {
    throw new Error(`Databricks submit failed [${submit.status}]: ${JSON.stringify(initial)}`);
  }

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
    current = await poll.json();
    if (!poll.ok) throw new Error(`Databricks poll failed [${poll.status}]: ${JSON.stringify(current)}`);
  }

  if (current.status?.state !== "SUCCEEDED") {
    throw new Error(`Databricks not finished: ${JSON.stringify(current.status)}`);
  }

  const schema = current.manifest?.schema?.columns ?? [];
  const columns: string[] = schema.map((c: { name: string }) => c.name);
  const dataArr: unknown[][] = current.result?.data_array ?? [];
  const rows = dataArr.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
  return { columns, rows };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(error: unknown, status = 500): Response {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("Edge function error:", error);
  return jsonResponse({ error: message }, status);
}
