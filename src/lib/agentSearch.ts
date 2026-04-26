// Multi-attribute reasoning over the local snapshot.
//
// Takes a structured QueryPlan from the nl-search edge function and scores
// every facility against it: hard requirements act as filters, capabilities,
// soft signals and proximity contribute weighted points, and trust is used
// as a tie-breaker. Returns a ranked top-N with a per-facility explanation
// of which criteria matched and which were missing — so the UI can show
// "partial match" results instead of returning empty when no perfect match
// exists.

import type { Facility } from "./types";
import { haversineKm, lookupCity } from "./india-geo";

export interface QueryPlan {
  intent: "nearest" | "best" | "filter";
  facilityTypes: string[];
  state: string | null;
  geoAnchor: { city: string | null; isRural: boolean } | null;
  capabilities: string[]; // surgery, trauma, icu, cardiology, oncology, dialysis, nicu, emergency
  softSignals: string[];
  minTrust: number;
  onlyVerified: boolean;
  onlyAnomalies: boolean;
}

export interface MatchResult {
  facility: Facility;
  score: number;
  distanceKm: number | null;
  matched: string[];   // human-readable matched criteria
  missing: string[];   // human-readable unmet criteria
  partial: boolean;
}

const CAP_FIELDS: Record<string, keyof Facility | null> = {
  surgery: "has_surgery",
  trauma: "has_trauma",
  icu: "has_icu",
  cardiology: "has_cardiology",
  oncology: "has_oncology",
  dialysis: "has_dialysis",
  nicu: "has_nicu",
  // No dedicated flag — fall back to fuzzy text match in capability/specialties.
  emergency: null,
};

function hasCap(f: Facility, cap: string): boolean {
  const field = CAP_FIELDS[cap];
  if (field) return Number(f[field]) === 1;
  // Emergency: fuzzy text match across capability fields.
  const blob = `${f.capability ?? ""} ${f.specialties ?? ""} ${f.equipment ?? ""}`.toLowerCase();
  return /emergenc|24[\s/]?7|trauma|casualty/.test(blob);
}

function softMatch(f: Facility, signal: string): boolean {
  const blob = [
    f.capability,
    f.specialties,
    f.equipment,
    f.reasoning,
    ...(f.supporting_evidence ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  // Token-based: every word of the signal must appear somewhere in the blob.
  const tokens = signal.split(/\s+/).filter((t) => t.length > 2);
  if (tokens.length === 0) return false;
  return tokens.every((t) => blob.includes(t));
}

export function runAgentSearch(all: Facility[], plan: QueryPlan, limit = 5): MatchResult[] {
  const anchor = plan.geoAnchor?.city ? lookupCity(plan.geoAnchor.city) : null;
  // If state was given but no city, anchor on the state's largest city for distance.
  const stateAnchor = !anchor && plan.state ? lookupCity(plan.state) : null;
  const geoOrigin = anchor ?? stateAnchor;

  const stateLc = plan.state?.toLowerCase() ?? null;
  const typeSet = new Set(plan.facilityTypes.map((t) => t.toLowerCase()));

  const candidates: MatchResult[] = [];

  for (const f of all) {
    // Hard filters
    if (typeSet.size && !typeSet.has((f.facility_type ?? "").toLowerCase())) continue;
    if (stateLc && (f.state ?? "").toLowerCase() !== stateLc) continue;
    if (plan.minTrust > 0 && f.trust_score < plan.minTrust) continue;
    if (plan.onlyVerified && !f.tavily_verified) continue;
    if (plan.onlyAnomalies && !((f.is_suspicious === 1 || f.trust_score < 0.4) && f.is_validated_safe !== 1)) continue;

    const matched: string[] = [];
    const missing: string[] = [];
    let score = 0;

    // Type / state matches always count
    if (typeSet.size) matched.push(`type=${[...typeSet].join("|")}`);
    if (stateLc) matched.push(`state=${plan.state}`);

    // Capability scoring — each cap is worth 25 points
    for (const cap of plan.capabilities) {
      if (hasCap(f, cap)) {
        score += 25;
        matched.push(cap);
      } else {
        missing.push(cap);
      }
    }

    // Soft signals — 12 points each
    for (const sig of plan.softSignals) {
      if (softMatch(f, sig)) {
        score += 12;
        matched.push(`"${sig}"`);
      } else {
        missing.push(`"${sig}"`);
      }
    }

    // Rural preference: prefer facilities NOT in major-city districts
    if (plan.geoAnchor?.isRural) {
      const district = (f.district ?? "").toLowerCase();
      const inMajorCity = lookupCity(district);
      if (!inMajorCity) {
        score += 8;
        matched.push("rural");
      } else {
        missing.push("rural (urban district)");
      }
    }

    // Distance scoring
    let distanceKm: number | null = null;
    if (geoOrigin) {
      distanceKm = haversineKm(geoOrigin.lat, geoOrigin.lon, f.lat, f.lon);
      // Closer = more points. 0 km -> +30, 500 km -> 0.
      const proximityPts = Math.max(0, 30 - distanceKm * 0.06);
      score += proximityPts;
      if (plan.intent === "nearest" && distanceKm < 100) matched.push(`${distanceKm.toFixed(0)} km away`);
    }

    // Trust as a small tie-breaker (0..10)
    score += f.trust_score * 10;
    // Verified bonus
    if (f.tavily_verified) score += 5;

    // For "nearest" intent we still want SOME relevance — require at least one capability or soft signal match
    // unless none were requested.
    const hadAsks = plan.capabilities.length + plan.softSignals.length > 0;
    if (hadAsks && matched.filter((m) => !m.startsWith("type=") && !m.startsWith("state=") && !m.endsWith("km away") && m !== "rural").length === 0) {
      // No capability or soft-signal match at all — drop unless the user only asked geographically.
      continue;
    }

    candidates.push({
      facility: f,
      score,
      distanceKm,
      matched,
      missing,
      partial: missing.length > 0,
    });
  }

  // Sort: nearest intent prioritises distance, otherwise score.
  if (plan.intent === "nearest" && geoOrigin) {
    candidates.sort((a, b) => {
      const da = a.distanceKm ?? Infinity;
      const db = b.distanceKm ?? Infinity;
      if (Math.abs(da - db) > 5) return da - db;
      return b.score - a.score;
    });
  } else {
    candidates.sort((a, b) => b.score - a.score);
  }

  return candidates.slice(0, limit);
}

export function planSummary(plan: QueryPlan): string {
  const parts: string[] = [];
  if (plan.facilityTypes.length) parts.push(plan.facilityTypes.join("/"));
  if (plan.capabilities.length) parts.push(`needs: ${plan.capabilities.join(", ")}`);
  if (plan.geoAnchor?.city) parts.push(`near ${plan.geoAnchor.city}`);
  if (plan.geoAnchor?.isRural) parts.push("rural");
  if (plan.state) parts.push(`in ${plan.state}`);
  if (plan.softSignals.length) parts.push(plan.softSignals.map((s) => `"${s}"`).join(" "));
  return parts.join(" · ") || "no constraints";
}
