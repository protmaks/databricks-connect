import { corsHeaders, errorResponse, jsonResponse, runSql } from "../_shared/databricks.ts";

const TABLE = "healthcare.gold.facility_intelligence_verified";

// Prefer Tavily-updated score when available.
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
  search?: string;
  state?: string;
  onlyAnomalies?: boolean;
  onlyVerified?: boolean;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body: Body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const minTrust = Math.max(0, Math.min(1, Number(body.minTrust ?? 0)));
    const limit = Math.max(1, Math.min(5000, Number(body.limit ?? 2000)));

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
    if (body.search) {
      where.push("(LOWER(name) LIKE LOWER(:search) OR LOWER(specialties) LIKE LOWER(:search) OR LOWER(address_city) LIKE LOWER(:search))");
      params.push({ name: "search", value: `%${body.search}%` });
    }
    if (body.onlyAnomalies) {
      where.push(`(is_suspicious = 1 OR (${EFFECTIVE_TRUST_SQL}) < 0.4) AND COALESCE(is_validated_safe, 0) = 0`);
    }
    if (body.onlyVerified) {
      where.push("tavily_verified = true");
    }

    const sql = `
      SELECT
        name AS id,
        name,
        CAST(latitude AS DOUBLE) AS lat,
        CAST(longitude AS DOUBLE) AS lon,
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
        CAST(last_tavily_check_date AS STRING) AS last_tavily_check_date,
        COALESCE(is_validated_safe, 0) AS is_validated_safe
      FROM ${TABLE}
      WHERE ${where.join(" AND ")}
        AND (${EFFECTIVE_TRUST_SQL}) >= ${minTrust}
      LIMIT ${limit}
    `;

    const { rows } = await runSql(sql, params, limit);
    return jsonResponse({ count: rows.length, facilities: rows });
  } catch (err) {
    return errorResponse(err);
  }
});
