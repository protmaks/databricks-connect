import { corsHeaders, errorResponse, jsonResponse, runSql } from "../_shared/databricks.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const sql = `
      SELECT
        COUNT(*) AS total,
        COUNT(latitude) AS with_lat,
        COUNT(longitude) AS with_lon,
        SUM(CASE WHEN TRY_CAST(latitude AS DOUBLE) IS NOT NULL THEN 1 ELSE 0 END) AS valid_lat,
        SUM(CASE WHEN TRY_CAST(longitude AS DOUBLE) IS NOT NULL THEN 1 ELSE 0 END) AS valid_lon
      FROM healthcare.gold.facility_intelligence_verified
    `;
    const { rows } = await runSql(sql, [], 10, { cache: false });
    return jsonResponse({ rows });
  } catch (err) {
    return errorResponse(err);
  }
});
