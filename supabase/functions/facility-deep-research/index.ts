import { corsHeaders, errorResponse, jsonResponse } from "../_shared/databricks.ts";

// "Deep Research" — uses Lovable AI to generate an enriched analysis report
// for a selected facility. Pure narrative; no external calls.

interface Body {
  name: string;
  facility_type?: string;
  state?: string;
  district?: string;
  trust_label?: string;
  trust_score?: number;
  capacity?: number | null;
  reasoning?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const facility: Body = await req.json();
    if (!facility?.name) return jsonResponse({ error: "missing facility" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a healthcare intelligence analyst. Produce a concise (max 220 words) Deep Research brief for the facility below. Structure as markdown with sections:
**Verification status**, **Likely contradictions** (3 bullets), **Recommended next checks** (3 bullets), **Risk to patients** (1 sentence).
Keep it analytical and grounded in what the data shows; never invent specific people.

Facility:
- Name: ${facility.name}
- Type: ${facility.facility_type ?? "unknown"}
- Location: ${facility.district ?? "?"}, ${facility.state ?? "?"}
- Trust label: ${facility.trust_label ?? "?"} (numeric ${facility.trust_score ?? "?"})
- Capacity (beds): ${facility.capacity ?? "unknown"}
- Existing reasoning log: ${facility.reasoning ?? "(none)"}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`AI gateway failed [${resp.status}]: ${text}`);
    }
    const data = await resp.json();
    const report: string = data.choices?.[0]?.message?.content ?? "No report generated.";
    return jsonResponse({ report });
  } catch (err) {
    return errorResponse(err);
  }
});
