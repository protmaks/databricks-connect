import { corsHeaders, errorResponse, jsonResponse } from "../_shared/databricks.ts";

// Translate a free-text query like "verified surgeons in rural Bihar"
// into structured filters for facilities-list. We use Lovable AI Gateway
// (no key needed) and a strict JSON schema.

interface Body {
  query: string;
}

const SYSTEM = `You convert healthcare search intents about Indian medical facilities into a strict JSON object.
Return ONLY JSON matching this schema:
{
  "facilityTypes": string[]   // subset of ["hospital","clinic","doctor","dentist","pharmacy","ayush","specialist","diagnostic"]; [] if none
  "minTrust": number          // 0..1; use 0.7 for "verified", 0.4 for "trusted", 0 otherwise
  "state": string | null      // Indian state in lowercase if mentioned, else null
  "search": string | null     // free-text keyword for name match (e.g. "surgeon", "trauma"), else null
  "onlyAnomalies": boolean,   // true only if user explicitly asks for suspicious/unverified ones
  "onlyVerified": boolean     // true only if user explicitly asks for Tavily-verified / externally verified facilities
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query }: Body = await req.json();
    if (!query || typeof query !== "string" || query.length > 500) {
      return jsonResponse({ error: "invalid query" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`AI gateway failed [${resp.status}]: ${text}`);
    }
    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    // Normalize
    const filters = {
      facilityTypes: Array.isArray(parsed.facilityTypes) ? parsed.facilityTypes : [],
      minTrust: typeof parsed.minTrust === "number" ? parsed.minTrust : 0,
      state: typeof parsed.state === "string" ? parsed.state : null,
      search: typeof parsed.search === "string" ? parsed.search : null,
      onlyAnomalies: Boolean(parsed.onlyAnomalies),
      onlyVerified: Boolean(parsed.onlyVerified),
    };

    return jsonResponse({ filters, raw: parsed });
  } catch (err) {
    return errorResponse(err);
  }
});
