import { corsHeaders, errorResponse, jsonResponse } from "../_shared/databricks.ts";

// Multi-attribute query planner.
// Converts free-text intent like
//   "Find the nearest facility in rural Bihar that can perform an emergency
//    appendectomy and typically leverages part-time doctors"
// into a structured plan that the client uses to score every facility:
//   - hard requirements (state, facility type) — disqualify if missing
//   - capabilities (binary flags from the gold table)
//   - soft signals (free-text terms searched across specialties / capability /
//     reasoning / supporting_evidence / equipment)
//   - geo anchor (Indian city / district to compute distance from)
//   - intent (nearest | best | cheapest)

interface Body {
  query: string;
}

const SYSTEM = `You convert healthcare intents about Indian medical facilities
into a strict JSON QUERY PLAN used to rank facilities.

Be tolerant of typos in Indian state and city names. Examples:
  Delhy/Dehli -> Delhi · Bihaar -> Bihar · Karnatka -> Karnataka
  Maharastra -> Maharashtra · Tamilnadu/TN -> Tamil Nadu
  Bombay -> Mumbai (city) + Maharashtra (state)
  Bangalore/Bengaluru -> Bengaluru + Karnataka

Capability vocabulary (use ONLY these tokens, in lowercase):
  surgery, trauma, icu, cardiology, oncology, dialysis, nicu, emergency

Map medical procedures to capabilities:
  appendectomy / appendicitis / cesarean / c-section / fracture surgery -> ["surgery", "emergency"]
  heart attack / chest pain / bypass / stent -> ["cardiology", "emergency"]
  cancer / chemo / radiation -> ["oncology"]
  newborn / preterm / premature baby -> ["nicu"]
  kidney failure / dialysis -> ["dialysis"]
  trauma / accident / road injury -> ["trauma", "emergency"]
  intensive care / ventilator / critical care -> ["icu"]

Return ONLY JSON matching this schema (no extra keys, no prose):
{
  "intent": "nearest" | "best" | "filter",
  "facilityTypes": string[],     // subset of ["hospital","clinic","doctor","dentist","pharmacy"]
  "state": string | null,        // canonical Indian state (Title Case)
  "geoAnchor": {                 // city/district mentioned to compute distance
    "city": string,              // e.g. "Patna", "Mumbai", null if none
    "isRural": boolean           // true if "rural", "village", "tier-3" etc.
  } | null,
  "capabilities": string[],      // from vocabulary above
  "softSignals": string[],       // short free-text phrases to fuzzy-match in capability/reasoning/evidence
                                 // examples: ["part-time doctors", "24/7", "low-cost", "trauma center"]
  "minTrust": number,            // 0..1; 0.7 if "verified/trusted", else 0
  "onlyVerified": boolean,       // true only if user explicitly asks tavily-verified
  "onlyAnomalies": boolean       // true only if user asks suspicious/unverified
}

Rules:
- "nearest" / "closest" / "near me" / "near <city>" -> intent="nearest"
- "best" / "top" / "highest rated" -> intent="best"
- otherwise intent="filter"
- If user says "rural", set geoAnchor.isRural=true (even without a city).
- ALWAYS include both the city in geoAnchor AND the state, when a city is mentioned.
- Soft signals capture organizational/operational nuance the binary capability
  flags can't express ("part-time doctors", "low-cost", "government-run", etc.).
  Keep each phrase short (<=4 words).`;

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
      if (resp.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded, try again later." }, 429);
      }
      if (resp.status === 402) {
        return jsonResponse({ error: "AI credits exhausted." }, 402);
      }
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

    const allowedCaps = new Set([
      "surgery", "trauma", "icu", "cardiology", "oncology", "dialysis", "nicu", "emergency",
    ]);
    const allowedTypes = new Set(["hospital", "clinic", "doctor", "dentist", "pharmacy"]);
    const allowedIntents = new Set(["nearest", "best", "filter"]);

    const rawAnchor = (parsed.geoAnchor ?? null) as Record<string, unknown> | null;
    const geoAnchor = rawAnchor && typeof rawAnchor === "object"
      ? {
          city: typeof rawAnchor.city === "string" && rawAnchor.city.trim() ? rawAnchor.city.trim() : null,
          isRural: Boolean(rawAnchor.isRural),
        }
      : null;

    const plan = {
      intent: typeof parsed.intent === "string" && allowedIntents.has(parsed.intent)
        ? parsed.intent as "nearest" | "best" | "filter"
        : "filter",
      facilityTypes: Array.isArray(parsed.facilityTypes)
        ? (parsed.facilityTypes as unknown[])
            .map((t) => String(t).toLowerCase())
            .filter((t) => allowedTypes.has(t))
        : [],
      state: typeof parsed.state === "string" && parsed.state.trim() ? parsed.state.trim() : null,
      geoAnchor: geoAnchor && (geoAnchor.city || geoAnchor.isRural) ? geoAnchor : null,
      capabilities: Array.isArray(parsed.capabilities)
        ? [...new Set(
            (parsed.capabilities as unknown[])
              .map((c) => String(c).toLowerCase().trim())
              .filter((c) => allowedCaps.has(c)),
          )]
        : [],
      softSignals: Array.isArray(parsed.softSignals)
        ? (parsed.softSignals as unknown[])
            .map((s) => String(s).toLowerCase().trim())
            .filter((s) => s.length > 0 && s.length < 60)
            .slice(0, 8)
        : [],
      minTrust: typeof parsed.minTrust === "number" ? Math.max(0, Math.min(1, parsed.minTrust)) : 0,
      onlyVerified: Boolean(parsed.onlyVerified),
      onlyAnomalies: Boolean(parsed.onlyAnomalies),
    };

    return jsonResponse({ plan, raw: parsed });
  } catch (err) {
    return errorResponse(err);
  }
});
