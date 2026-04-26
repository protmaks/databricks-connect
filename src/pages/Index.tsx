import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KpiHeader } from "@/components/dashboard/KpiHeader";
import { FiltersSidebar } from "@/components/dashboard/FiltersSidebar";
import { MapView } from "@/components/dashboard/MapView";
import { AgentDetailPanel } from "@/components/dashboard/AgentDetailPanel";
import { fetchSnapshot } from "@/lib/api";
import { buildAggregate, filterFacilities } from "@/lib/filter";
import { DEFAULT_FILTERS, type Facility, type FilterState } from "@/lib/types";
import { toast } from "sonner";

const Index = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Facility | null>(null);
  const queryClient = useQueryClient();

  // ONE network request — everything else is computed in-memory.
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

  // Cap facility scatter points at zoom-out for perf; all 10k still feed the hex layer.
  const scatterFacilities = useMemo(() => filtered.slice(0, 2000), [filtered]);

  const handleRefresh = async () => {
    toast.info("Refreshing facilities…");
    await queryClient.invalidateQueries({ queryKey: ["snapshot"] });
    await snapshotQ.refetch();
    toast.success("Facilities refreshed");
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
        <FiltersSidebar filters={filters} onChange={setFilters} states={aggregate.states} />
        <main className="relative min-w-0 flex-1">
          <MapView
            points={aggregate.points}
            facilities={scatterFacilities}
            onFacilityClick={setSelected}
            showDeserts={filters.showDeserts}
          />
          <AgentDetailPanel facility={selected} onClose={() => setSelected(null)} />
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
