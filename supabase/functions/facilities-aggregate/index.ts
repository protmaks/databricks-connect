import { corsHeaders, errorResponse, jsonResponse, runSql } from "../_shared/databricks.ts";

const TABLE = "healthcare.gold.facility_intelligence_verified";

// Prefer Tavily-updated trust score when available, fall back to original.
const EFFECTIVE_TRUST_SQL = `
  CASE LOWER(COALESCE(tavily_updated_trust_score, trust_score, 'unverified'))
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
  state?: string;
  onlyVerified?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body: Body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const minTrust = Math.max(0, Math.min(1, Number(body.minTrust ?? 0)));

    const where: string[] = [
      "latitude IS NOT NULL",
      "longitude IS NOT NULL",
      "TRY_CAST(latitude AS DOUBLE) IS NOT NULL",
      "TRY_CAST(longitude AS DOUBLE) IS NOT NULL",
    ];
    const params: { name: string; value: string | number | null; type?: string }[] = [];
    if (body.facilityTypes && body.facilityTypes.length) {
      const list = body.facilityTypes
        .map((t) => `'${t.replace(/'/g, "''").toLowerCase()}'`)
        .join(",");
      where.push(`LOWER(facilitytypeid) IN (${list})`);
    }
    if (body.state) {
      where.push("LOWER(address_stateorregion) = LOWER(:state)");
      params.push({ name: "state", value: body.state });
    }
    if (body.onlyVerified) {
      where.push("tavily_verified = true");
    }
    where.push(`(${EFFECTIVE_TRUST_SQL}) >= ${minTrust}`);

    const kpiSql = `
      SELECT
        COUNT(*) AS total_facilities,
        SUM(COALESCE(TRY_CAST(capacity AS INT), 0)) AS total_capacity,
        AVG(${EFFECTIVE_TRUST_SQL}) AS avg_trust,
        SUM(CASE WHEN is_suspicious = 1 OR (${EFFECTIVE_TRUST_SQL}) < 0.4 THEN 1 ELSE 0 END) AS anomalies,
        COUNT(DISTINCT address_stateorregion) AS states_covered,
        SUM(CASE WHEN tavily_verified = true THEN 1 ELSE 0 END) AS verified_count,
        SUM(CASE WHEN tavily_check_status IS NOT NULL THEN 1 ELSE 0 END) AS checked_count
      FROM ${TABLE}
      WHERE ${where.join(" AND ")}
    `;

    const stateSql = `
      SELECT
        address_stateorregion AS state,
        COUNT(*) AS facility_count,
        AVG(${EFFECTIVE_TRUST_SQL}) AS avg_trust,
        SUM(CASE WHEN tavily_verified = true THEN 1 ELSE 0 END) AS verified_count,
        AVG(CAST(latitude AS DOUBLE)) AS lat,
        AVG(CAST(longitude AS DOUBLE)) AS lon
      FROM ${TABLE}
      WHERE ${where.join(" AND ")}
        AND address_stateorregion IS NOT NULL
      GROUP BY address_stateorregion
      ORDER BY facility_count DESC
      LIMIT 100
    `;

    const pointsSql = `
      SELECT
        CAST(latitude AS DOUBLE) AS lat,
        CAST(longitude AS DOUBLE) AS lon,
        ${EFFECTIVE_TRUST_SQL} AS trust,
        COALESCE(TRY_CAST(capacity AS INT), 1) AS weight,
        is_suspicious AS suspicious,
        CASE WHEN tavily_verified = true THEN 1 ELSE 0 END AS verified
      FROM ${TABLE}
      WHERE ${where.join(" AND ")}
      LIMIT 10000
    `;

    const [kpi, states, points] = await Promise.all([
      runSql(kpiSql, params),
      runSql(stateSql, params),
      runSql(pointsSql, params, 10000),
    ]);

    return jsonResponse({
      kpi: kpi.rows[0] ?? {},
      states: states.rows,
      points: points.rows,
    });
  } catch (err) {
    return errorResponse(err);
  }
});
