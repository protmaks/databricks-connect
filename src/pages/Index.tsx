import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { KpiHeader } from "@/components/dashboard/KpiHeader";
import { FiltersSidebar } from "@/components/dashboard/FiltersSidebar";
import { MapView } from "@/components/dashboard/MapView";
import { AgentDetailPanel } from "@/components/dashboard/AgentDetailPanel";
import { AiMatchesPanel } from "@/components/dashboard/AiMatchesPanel";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    setSelected(null);
    setAgentPlan(plan);
    setAgentQuery(query);
    setFiltersOpen(false);
  };

  const handleFiltersChange = (next: FilterState) => {
    setFilters(next);
    setSelected(null);
    setAgentPlan(null);
  };

  const handleSelectFromMatches = (f: Facility) => {
    setSelected(f);
    setFiltersOpen(false);
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
      <div className="relative flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <FiltersSidebar
            filters={filters}
            onChange={handleFiltersChange}
            states={aggregate.states}
            onAgentPlan={handleAgentPlan}
          />
        </div>

        {/* Mobile filters toggle */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="absolute left-3 top-3 z-30 h-9 gap-1.5 bg-card/90 backdrop-blur md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-xs">Filters & AI</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm border-border bg-panel p-0 sm:w-96">
            <SheetTitle className="sr-only">Filters and AI search</SheetTitle>
            <FiltersSidebar
              filters={filters}
              onChange={handleFiltersChange}
              states={aggregate.states}
              onAgentPlan={handleAgentPlan}
            />
          </SheetContent>
        </Sheet>

        <main className="relative flex min-w-0 flex-1">
          <div className="relative min-w-0 flex-1">
            <MapView
              points={aggregate.points}
              facilities={filtered}
              onFacilityClick={setSelected}
              anomalyMode={filters.onlyAnomalies}
              highlightIds={highlightIds}
            />
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
          </div>
          {agentPlan && (
            <div className="absolute inset-0 z-20 h-full w-full md:static md:w-[360px] md:max-w-[45%] md:shrink-0">
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
            <div className="absolute inset-0 z-30 h-full w-full md:static md:w-[360px] md:max-w-[45%] md:shrink-0">
              <AgentDetailPanel
                facility={selected}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
