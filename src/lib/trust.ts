// Trust score → color (HSL strings + RGB array for deck.gl)
import type { Facility } from "./types";

export function trustColorClass(score: number): string {
  if (score >= 0.7) return "text-trust-high";
  if (score >= 0.4) return "text-trust-mid";
  return "text-trust-low";
}

export function trustBadge(score: number): { label: string; cls: string } {
  if (score >= 0.7) return { label: "AI Verified", cls: "bg-trust-high/15 text-trust-high border-trust-high/40" };
  if (score >= 0.4) return { label: "Unverified", cls: "bg-trust-mid/15 text-trust-mid border-trust-mid/40" };
  return { label: "Suspicious", cls: "bg-trust-low/15 text-trust-low border-trust-low/40" };
}

// deck.gl wants RGBA arrays
export function trustToRGBA(score: number, alpha = 200): [number, number, number, number] {
  // red → amber → emerald gradient
  const t = Math.max(0, Math.min(1, score));
  if (t < 0.5) {
    const k = t / 0.5;
    return [Math.round(239 - (239 - 245) * k), Math.round(68 + (158 - 68) * k), Math.round(68 + (11 - 68) * k), alpha];
  }
  const k = (t - 0.5) / 0.5;
  return [Math.round(245 - (245 - 16) * k), Math.round(158 + (185 - 158) * k), Math.round(11 + (129 - 11) * k), alpha];
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

export function facilityCapabilities(f: Facility): string[] {
  const caps: string[] = [];
  if (f.has_icu) caps.push("ICU");
  if (f.has_nicu) caps.push("NICU");
  if (f.has_trauma) caps.push("Trauma");
  if (f.has_surgery) caps.push("Surgery");
  if (f.has_cardiology) caps.push("Cardiology");
  if (f.has_oncology) caps.push("Oncology");
  if (f.has_dialysis) caps.push("Dialysis");
  return caps;
}
