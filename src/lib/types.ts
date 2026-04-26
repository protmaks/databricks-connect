// Domain types matching the edge-function payloads.

export type FacilityType =
  | "hospital"
  | "clinic"
  | "doctor"
  | "dentist"
  | "pharmacy"
  | string;

export interface Facility {
  id: string;
  name: string;
  lat: number;
  lon: number;
  facility_type: FacilityType;
  state: string | null;
  district: string | null;
  address_line1: string | null;
  zip: string | null;
  phone_numbers: string | null;
  email: string | null;
  websites: string | null;
  trust_label: "High" | "Medium" | "Low" | "Unverified" | string;
  original_trust_label: string | null;
  tavily_updated_trust_score: string | null;
  trust_score: number; // 0..1
  capacity: number | null;
  doctors: number | null;
  specialties: string | null;
  equipment: string | null;
  capability: string | null;
  is_suspicious: number;
  has_icu: number;
  has_trauma: number;
  has_surgery: number;
  has_cardiology: number;
  has_oncology: number;
  has_dialysis: number;
  has_nicu: number;
  icu_citations: string[] | null;
  reasoning: string | null;
  missing_evidence: string[] | null;
  supporting_evidence: string[] | null;
  tavily_verified: boolean | null;
  tavily_check_status: string | null;
  tavily_evidence_urls: string[] | null;
  tavily_evidence_snippets: string[] | null;
  last_tavily_check_date: string | null;
}

export interface KpiSummary {
  total_facilities: number;
  total_capacity: number;
  avg_trust: number;
  anomalies: number;
  states_covered: number;
  verified_count: number;
  checked_count: number;
}

export interface StateAggregate {
  state: string;
  facility_count: number;
  avg_trust: number;
  verified_count: number;
  lat: number;
  lon: number;
}

export interface PointAggregate {
  lat: number;
  lon: number;
  trust: number;
  weight: number;
  suspicious: number;
  verified: number;
}

export interface AggregatePayload {
  kpi: KpiSummary;
  states: StateAggregate[];
  points: PointAggregate[];
}

export interface FilterState {
  facilityTypes: string[];
  minTrust: number;
  search: string | null;
  state: string | null;
  onlyAnomalies: boolean;
  onlyVerified: boolean;
  showDeserts: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  facilityTypes: [],
  minTrust: 0,
  search: null,
  state: null,
  onlyAnomalies: false,
  onlyVerified: false,
  showDeserts: false,
};

export const FACILITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "doctor", label: "Doctor" },
  { value: "dentist", label: "Dentist" },
  { value: "pharmacy", label: "Pharmacy" },
];
