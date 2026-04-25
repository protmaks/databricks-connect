import { corsHeaders, errorResponse, jsonResponse, runSql } from "../_shared/databricks.ts";

const TABLE = "healthcare.silver.facility_intelligence";

// Map textual trust_score -> numeric for downstream UI math.
// CASE values discovered during data inspection: High / Unverified / Low (and possibly nulls).
const TRUST_NUMERIC_SQL = `
  CASE LOWER(COALESCE(trust_score, 'unverified'))
    WHEN 'high' THEN 1.0
    WHEN 'medium' THEN 0.6
    WHEN 'unverified' THEN 0.5
    WHEN 'low' THEN 0.15
    ELSE 0.5
  END
`;

interface Body {
  facilityTypes?: string[];
  minTrust?: number;
  search?: string;
  state?: string;
  onlyAnomalies?: boolean;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body: Body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const minTrust = Math.max(0, Math.min(1, Number(body.minTrust ?? 0)));
    const limit = Math.max(1, Math.min(5000, Number(body.limit ?? 2000)));

    const where: string[] = ["latitude IS NOT NULL", "longitude IS NOT NULL"];
    const params: { name: string; value: string | number | null; type?: string }[] = [];

    if (body.facilityTypes && body.facilityTypes.length) {
      const list = body.facilityTypes
        .map((t) => `'${t.replace(/'/g, "''").toLowerCase()}'`)
        .join(",");
      where.push(`LOWER(facilitytypeid) IN (${list})`);
    }
    if (body.state) {
      where.push("LOWER(state) = LOWER(:state)");
      params.push({ name: "state", value: body.state });
    }
    if (body.search) {
      where.push("(LOWER(name) LIKE LOWER(:search) OR LOWER(state) LIKE LOWER(:search))");
      params.push({ name: "search", value: `%${body.search}%` });
    }
    if (body.onlyAnomalies) {
      where.push(`(${TRUST_NUMERIC_SQL}) < 0.4`);
    }

    const sql = `
      SELECT
        id,
        name,
        CAST(latitude AS DOUBLE) AS lat,
        CAST(longitude AS DOUBLE) AS lon,
        facilitytypeid AS facility_type,
        state,
        district,
        trust_score AS trust_label,
        ${TRUST_NUMERIC_SQL} AS trust_score,
        capacity,
        last_updated,
        reasoning,
        trace_url
      FROM ${TABLE}
      WHERE ${where.join(" AND ")}
        AND (${TRUST_NUMERIC_SQL}) >= ${minTrust}
      LIMIT ${limit}
    `;

    const { rows } = await runSql(sql, params, limit);
    return jsonResponse({ count: rows.length, facilities: rows });
  } catch (err) {
    return errorResponse(err);
  }
});
