import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiHeader } from "@/components/dashboard/KpiHeader";
import { FiltersSidebar } from "@/components/dashboard/FiltersSidebar";
import { MapView } from "@/components/dashboard/MapView";
import { AgentDetailPanel } from "@/components/dashboard/AgentDetailPanel";
import { fetchAggregate, fetchFacilities } from "@/lib/api";
import { DEFAULT_FILTERS, type Facility, type FilterState } from "@/lib/types";
import { toast } from "sonner";

const Index = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Facility | null>(null);

  const aggregateQ = useQuery({
    queryKey: ["aggregate", filters],
    queryFn: () => fetchAggregate(filters),
    staleTime: 60_000,
  });

  const facilitiesQ = useQuery({
    queryKey: ["facilities", filters],
    queryFn: () => fetchFacilities(filters, 1500),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (aggregateQ.error) {
      toast.error("Failed to load aggregates", {
        description: aggregateQ.error instanceof Error ? aggregateQ.error.message : "Unknown",
      });
    }
  }, [aggregateQ.error]);

  useEffect(() => {
    if (facilitiesQ.error) {
      toast.error("Failed to load facilities", {
        description: facilitiesQ.error instanceof Error ? facilitiesQ.error.message : "Unknown",
      });
    }
  }, [facilitiesQ.error]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <KpiHeader kpi={aggregateQ.data?.kpi ?? null} loading={aggregateQ.isLoading} />
      <div className="flex min-h-0 flex-1">
        <FiltersSidebar
          filters={filters}
          onChange={setFilters}
          states={aggregateQ.data?.states ?? []}
        />
        <main className="relative min-w-0 flex-1">
          <MapView
            points={aggregateQ.data?.points ?? []}
            facilities={facilitiesQ.data ?? []}
            onFacilityClick={setSelected}
            showDeserts={filters.showDeserts}
          />
          <AgentDetailPanel facility={selected} onClose={() => setSelected(null)} />
          {(aggregateQ.isLoading || facilitiesQ.isLoading) && (
            <div className="pointer-events-none absolute right-4 top-4 rounded-md border border-border bg-card/80 px-3 py-1.5 font-mono text-[11px] text-muted-foreground backdrop-blur">
              Loading from Databricks…
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
