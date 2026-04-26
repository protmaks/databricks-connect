import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KpiHeader } from "@/components/dashboard/KpiHeader";
import { FiltersSidebar } from "@/components/dashboard/FiltersSidebar";
import { MapView } from "@/components/dashboard/MapView";
import { AgentDetailPanel } from "@/components/dashboard/AgentDetailPanel";
import { AiMatchesPanel } from "@/components/dashboard/AiMatchesPanel";
import { fetchSnapshot } from "@/lib/api";
import { buildAggregate, filterFacilities } from "@/lib/filter";
import { DEFAULT_FILTERS, type Facility, type FilterState } from "@/lib/types";
import { runAgentSearch, type QueryPlan } from "@/lib/agentSearch";
import { toast } from "sonner";

const Index = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [agentPlan, setAgentPlan] = useState<QueryPlan | null>(null);
  const [agentQuery, setAgentQuery] = useState("");
  const queryClient = useQueryClient();

  const snapshotQ = useQuery({
    queryKey: ["snapshot"],
    queryFn: () => fetchSnapshot(),
  });

  useEffect(() => {
    if (snapshotQ.error) {
      toast.error("Failed to load facilities", {
        description: snapshotQ.error instanceof Error ? snapshotQ.error.message : "Unknown",
      });
    }
  }, [snapshotQ.error]);

  const filtered = useMemo(
    () => (snapshotQ.data ? filterFacilities(snapshotQ.data, filters) : []),
    [snapshotQ.data, filters],
  );

  const aggregate = useMemo(() => buildAggregate(filtered), [filtered]);

  // Agent search runs against the FULL snapshot (not the filtered subset),
  // because the plan already encodes its own hard filters.
  const agentMatches = useMemo(() => {
    if (!agentPlan || !snapshotQ.data) return [];
    return runAgentSearch(snapshotQ.data, agentPlan, 5);
  }, [agentPlan, snapshotQ.data]);

  const highlightIds = useMemo(
    () => new Set(agentMatches.map((m) => m.facility.id)),
    [agentMatches],
  );

  const handleAgentPlan = (plan: QueryPlan, query: string) => {
    setAgentPlan(plan);
    setAgentQuery(query);
  };

  const handleSelectFromMatches = (f: Facility) => {
    setSelected(f);
  };

  const handleRefresh = async () => {
    const t = toast.loading("Refreshing facilities…");
    try {
      const fresh = await fetchSnapshot(true);
      queryClient.setQueryData(["snapshot"], fresh);
      toast.success(`Facilities refreshed (${fresh.length})`, { id: t });
    } catch (err) {
      toast.error("Refresh failed", {
        id: t,
        description: err instanceof Error ? err.message : "Unknown",
      });
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <KpiHeader
        kpi={aggregate.kpi}
        loading={snapshotQ.isLoading}
        refreshing={snapshotQ.isFetching}
        onRefresh={handleRefresh}
        lastUpdated={snapshotQ.dataUpdatedAt || null}
      />
      <div className="flex min-h-0 flex-1">
        <FiltersSidebar
          filters={filters}
          onChange={setFilters}
          states={aggregate.states}
          onAgentPlan={handleAgentPlan}
        />
        <main className="relative min-w-0 flex-1">
          <MapView
            points={aggregate.points}
            facilities={filtered}
            onFacilityClick={setSelected}
            anomalyMode={filters.onlyAnomalies}
            highlightIds={highlightIds}
          />
          {(agentPlan || selected) && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex h-full w-full max-w-full sm:w-[min(820px,100%)] md:w-[min(900px,80%)]">
              <div className="pointer-events-auto flex h-full w-full">
                {agentPlan && (
                  <div className={cn("h-full min-w-0", selected ? "w-1/2" : "w-full")}>
                    <AiMatchesPanel
                      plan={agentPlan}
                      results={agentMatches}
                      query={agentQuery}
                      onClose={() => setAgentPlan(null)}
                      onSelect={handleSelectFromMatches}
                    />
                  </div>
                )}
                {selected && (
                  <div className={cn("h-full min-w-0", agentPlan ? "w-1/2" : "w-full")}>
                    <AgentDetailPanel
                      facility={selected}
                      onClose={() => setSelected(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {snapshotQ.isLoading && (
            <div className="pointer-events-none absolute right-4 top-4 rounded-md border border-border bg-card/80 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur">
              Loading 10K facilities…
            </div>
          )}
          {snapshotQ.isFetching && !snapshotQ.isLoading && (
            <div className="pointer-events-none absolute right-4 top-4 rounded-md border border-border bg-card/40 px-3 py-1 font-mono text-[10px] text-muted-foreground/70 backdrop-blur">
              Refreshing…
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
