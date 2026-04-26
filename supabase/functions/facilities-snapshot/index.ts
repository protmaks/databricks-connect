import { corsHeaders, errorResponse, jsonResponse, runSql } from "../_shared/databricks.ts";

const TABLE = "healthcare.gold.facility_intelligence_verified";

const EFFECTIVE_TRUST_SQL = `
  CASE LOWER(COALESCE(tavily_updated_trust_score, trust_score, 'unverified'))
    WHEN 'high' THEN 1.0
    WHEN 'medium' THEN 0.6
    WHEN 'unverified' THEN 0.5
    WHEN 'low' THEN 0.15
    ELSE 0.5
  END
`;

// Returns the entire table (lat/lon-bound) in one go so the client can
// filter / aggregate locally without re-hitting Databricks.
// Cached server-side for CACHE_TTL_SECONDS (default 5 min).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const sql = `
      SELECT
        name AS id,
        name,
        TRY_CAST(latitude AS DOUBLE) AS lat,
        TRY_CAST(longitude AS DOUBLE) AS lon,
        facilitytypeid AS facility_type,
        address_stateorregion AS state,
        address_city AS district,
        address_line1,
        address_ziporpostcode AS zip,
        phone_numbers,
        email,
        websites,
        COALESCE(tavily_updated_trust_score, trust_score) AS trust_label,
        trust_score AS original_trust_label,
        tavily_updated_trust_score,
        ${EFFECTIVE_TRUST_SQL} AS trust_score,
        TRY_CAST(capacity AS INT) AS capacity,
        TRY_CAST(numberdoctors AS INT) AS doctors,
        specialties,
        equipment,
        capability,
        is_suspicious,
        has_icu, has_trauma, has_surgery, has_cardiology, has_oncology, has_dialysis, has_nicu,
        icu_citations,
        reason AS reasoning,
        missing_evidence,
        supporting_evidence,
        tavily_verified,
        tavily_check_status,
        tavily_evidence_urls,
        tavily_evidence_snippets,
        CAST(last_tavily_check_date AS STRING) AS last_tavily_check_date
      FROM ${TABLE}
      LIMIT 20000
    `;

    const { rows } = await runSql(sql, [], 20000);
    return jsonResponse(
      { count: rows.length, facilities: rows, generated_at: new Date().toISOString() },
      200,
      // Browser/CDN cache layer on top of the in-memory edge cache.
      { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    );
  } catch (err) {
    return errorResponse(err);
  }
});
