// Pure client-side filtering & aggregation over the snapshot.
// Keeps the dashboard responsive without re-hitting Databricks.

import type {
  AggregatePayload,
  Facility,
  FilterState,
  KpiSummary,
  PointAggregate,
  StateAggregate,
} from "./types";

export function filterFacilities(all: Facility[], f: FilterState): Facility[] {
  const types = f.facilityTypes.length ? new Set(f.facilityTypes.map((t) => t.toLowerCase())) : null;
  const stateLc = f.state ? f.state.toLowerCase() : null;
  const search = f.search ? f.search.toLowerCase() : null;

  return all.filter((x) => {
    if (types && !types.has((x.facility_type ?? "").toLowerCase())) return false;
    if (stateLc && (x.state ?? "").toLowerCase() !== stateLc) return false;
    if (f.minTrust > 0 && x.trust_score < f.minTrust) return false;
    if (f.onlyVerified && !x.tavily_verified) return false;
    if (f.onlyAnomalies && !((x.is_suspicious === 1 || x.trust_score < 0.4) && x.is_validated_safe !== 1)) return false;
    if (search) {
      const blob = `${x.name} ${x.specialties ?? ""} ${x.district ?? ""}`.toLowerCase();
      if (!blob.includes(search)) return false;
    }
    return true;
  });
}

export function computeKpi(rows: Facility[]): KpiSummary {
  let totalCapacity = 0;
  let trustSum = 0;
  let anomalies = 0;
  let verified = 0;
  let checked = 0;
  const states = new Set<string>();
  for (const r of rows) {
    totalCapacity += r.capacity ?? 0;
    trustSum += r.trust_score;
    if ((r.is_suspicious === 1 || r.trust_score < 0.4) && r.is_validated_safe !== 1) anomalies++;
    if (r.tavily_verified) verified++;
    if (r.tavily_check_status) checked++;
    if (r.state) states.add(r.state);
  }
  return {
    total_facilities: rows.length,
    total_capacity: totalCapacity,
    avg_trust: rows.length ? trustSum / rows.length : 0,
    anomalies,
    states_covered: states.size,
    verified_count: verified,
    checked_count: checked,
  };
}

export function computeStates(rows: Facility[]): StateAggregate[] {
  const acc = new Map<string, { count: number; trust: number; verified: number; lat: number; lon: number }>();
  for (const r of rows) {
    if (!r.state) continue;
    const key = r.state;
    const cur = acc.get(key) ?? { count: 0, trust: 0, verified: 0, lat: 0, lon: 0 };
    cur.count++;
    cur.trust += r.trust_score;
    if (r.tavily_verified) cur.verified++;
    cur.lat += r.lat;
    cur.lon += r.lon;
    acc.set(key, cur);
  }
  return [...acc.entries()]
    .map(([state, v]) => ({
      state,
      facility_count: v.count,
      avg_trust: v.trust / v.count,
      verified_count: v.verified,
      lat: v.lat / v.count,
      lon: v.lon / v.count,
    }))
    .sort((a, b) => b.facility_count - a.facility_count)
    .slice(0, 100);
}

export function computePoints(rows: Facility[]): PointAggregate[] {
  return rows.map((r) => ({
    lat: r.lat,
    lon: r.lon,
    trust: r.trust_score,
    weight: r.capacity ?? 1,
    suspicious: r.is_suspicious,
    verified: r.tavily_verified ? 1 : 0,
  }));
}

export function buildAggregate(rows: Facility[]): AggregatePayload {
  return {
    kpi: computeKpi(rows),
    states: computeStates(rows),
    points: computePoints(rows),
  };
}
