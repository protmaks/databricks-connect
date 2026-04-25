import { corsHeaders, errorResponse, jsonResponse, runSql } from "../_shared/databricks.ts";

const TABLE = "healthcare.silver.facility_intelligence";

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
  state?: string;
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
    where.push(`(${TRUST_NUMERIC_SQL}) >= ${minTrust}`);

    const kpiSql = `
      SELECT
        COUNT(*) AS total_facilities,
        SUM(COALESCE(TRY_CAST(capacity AS INT), 0)) AS total_capacity,
        AVG(${TRUST_NUMERIC_SQL}) AS avg_trust,
        SUM(CASE WHEN is_suspicious = 1 OR (${TRUST_NUMERIC_SQL}) < 0.4 THEN 1 ELSE 0 END) AS anomalies,
        COUNT(DISTINCT address_stateorregion) AS states_covered
      FROM ${TABLE}
      WHERE ${where.join(" AND ")}
    `;

    const stateSql = `
      SELECT
        address_stateorregion AS state,
        COUNT(*) AS facility_count,
        AVG(${TRUST_NUMERIC_SQL}) AS avg_trust,
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
        ${TRUST_NUMERIC_SQL} AS trust,
        COALESCE(TRY_CAST(capacity AS INT), 1) AS weight,
        is_suspicious AS suspicious
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
