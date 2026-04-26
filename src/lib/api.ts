import { supabase } from "@/integrations/supabase/client";
import type {
  AggregatePayload,
  Facility,
  FilterState,
  KpiSummary,
  PointAggregate,
  StateAggregate,
} from "./types";

// All numeric fields come back as strings from Databricks JSON_ARRAY. Coerce here.
const toNum = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toStrArr = (v: unknown): string[] | null => {
  if (!v) return null;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map(String) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const toBool = (v: unknown): boolean | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  if (typeof v === "number") return v !== 0;
  return null;
};

function normalizeFacility(raw: Record<string, unknown>): Facility {
  return {
    id: String(raw.id ?? raw.name ?? Math.random()),
    name: String(raw.name ?? "Unknown"),
    lat: toNum(raw.lat),
    lon: toNum(raw.lon),
    facility_type: String(raw.facility_type ?? "unknown"),
    state: (raw.state as string) ?? null,
    district: (raw.district as string) ?? null,
    address_line1: (raw.address_line1 as string) ?? null,
    zip: (raw.zip as string) ?? null,
    phone_numbers: (raw.phone_numbers as string) ?? null,
    email: (raw.email as string) ?? null,
    websites: (raw.websites as string) ?? null,
    trust_label: String(raw.trust_label ?? "Unverified"),
    original_trust_label: (raw.original_trust_label as string) ?? null,
    tavily_updated_trust_score: (raw.tavily_updated_trust_score as string) ?? null,
    trust_score: toNum(raw.trust_score, 0.5),
    capacity: raw.capacity == null ? null : toNum(raw.capacity, 0),
    doctors: raw.doctors == null ? null : toNum(raw.doctors, 0),
    specialties: (raw.specialties as string) ?? null,
    equipment: (raw.equipment as string) ?? null,
    capability: (raw.capability as string) ?? null,
    is_suspicious: toNum(raw.is_suspicious),
    has_icu: toNum(raw.has_icu),
    has_trauma: toNum(raw.has_trauma),
    has_surgery: toNum(raw.has_surgery),
    has_cardiology: toNum(raw.has_cardiology),
    has_oncology: toNum(raw.has_oncology),
    has_dialysis: toNum(raw.has_dialysis),
    has_nicu: toNum(raw.has_nicu),
    icu_citations: toStrArr(raw.icu_citations),
    reasoning: (raw.reasoning as string) ?? null,
    missing_evidence: toStrArr(raw.missing_evidence),
    supporting_evidence: toStrArr(raw.supporting_evidence),
    tavily_verified: toBool(raw.tavily_verified),
    tavily_check_status: (raw.tavily_check_status as string) ?? null,
    tavily_evidence_urls: toStrArr(raw.tavily_evidence_urls),
    tavily_evidence_snippets: toStrArr(raw.tavily_evidence_snippets),
    last_tavily_check_date: (raw.last_tavily_check_date as string) ?? null,
  };
}

function normalizeKpi(raw: Record<string, unknown>): KpiSummary {
  return {
    total_facilities: toNum(raw.total_facilities),
    total_capacity: toNum(raw.total_capacity),
    avg_trust: toNum(raw.avg_trust),
    anomalies: toNum(raw.anomalies),
    states_covered: toNum(raw.states_covered),
    verified_count: toNum(raw.verified_count),
    checked_count: toNum(raw.checked_count),
  };
}

function normalizeStates(rows: Record<string, unknown>[]): StateAggregate[] {
  return rows.map((r) => ({
    state: String(r.state ?? "Unknown"),
    facility_count: toNum(r.facility_count),
    avg_trust: toNum(r.avg_trust, 0.5),
    verified_count: toNum(r.verified_count),
    lat: toNum(r.lat),
    lon: toNum(r.lon),
  }));
}

function normalizePoints(rows: Record<string, unknown>[]): PointAggregate[] {
  return rows
    .map((r) => ({
      lat: toNum(r.lat),
      lon: toNum(r.lon),
      trust: toNum(r.trust, 0.5),
      weight: toNum(r.weight, 1),
      suspicious: toNum(r.suspicious),
      verified: toNum(r.verified),
    }))
    .filter((p) => p.lat !== 0 && p.lon !== 0);
}

function buildBody(filters: FilterState) {
  return {
    facilityTypes: filters.facilityTypes,
    minTrust: filters.minTrust,
    state: filters.state,
    search: filters.search ?? undefined,
    onlyAnomalies: filters.onlyAnomalies,
    onlyVerified: filters.onlyVerified,
  };
}

export async function fetchAggregate(filters: FilterState): Promise<AggregatePayload> {
  const { data, error } = await supabase.functions.invoke("facilities-aggregate", {
    body: buildBody(filters),
  });
  if (error) throw error;
  return {
    kpi: normalizeKpi(data?.kpi ?? {}),
    states: normalizeStates(data?.states ?? []),
    points: normalizePoints(data?.points ?? []),
  };
}

export async function fetchFacilities(filters: FilterState, limit = 1500): Promise<Facility[]> {
  const { data, error } = await supabase.functions.invoke("facilities-list", {
    body: { ...buildBody(filters), limit },
  });
  if (error) throw error;
  return (data?.facilities ?? []).map(normalizeFacility);
}

export async function nlSearch(query: string): Promise<Partial<FilterState>> {
  const { data, error } = await supabase.functions.invoke("nl-search", {
    body: { query },
  });
  if (error) throw error;
  const f = data?.filters ?? {};
  return {
    facilityTypes: Array.isArray(f.facilityTypes) ? f.facilityTypes : [],
    minTrust: typeof f.minTrust === "number" ? f.minTrust : 0,
    state: typeof f.state === "string" ? f.state : null,
    search: typeof f.search === "string" ? f.search : null,
    onlyAnomalies: Boolean(f.onlyAnomalies),
    onlyVerified: Boolean(f.onlyVerified),
  };
}

export async function deepResearch(facility: Facility): Promise<string> {
  const { data, error } = await supabase.functions.invoke("facility-deep-research", {
    body: {
      name: facility.name,
      facility_type: facility.facility_type,
      state: facility.state,
      district: facility.district,
      trust_label: facility.trust_label,
      trust_score: facility.trust_score,
      capacity: facility.capacity,
      reasoning: facility.reasoning,
      specialties: facility.specialties,
      missing_evidence: facility.missing_evidence,
    },
  });
  if (error) throw error;
  return data?.report ?? "No report.";
}
