import { useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { nlSearch } from "@/lib/api";
import {
  DEFAULT_FILTERS,
  FACILITY_TYPE_OPTIONS,
  type FilterState,
  type StateAggregate,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  states: StateAggregate[];
}

export function FiltersSidebar({ filters, onChange, states }: SidebarProps) {
  const [nlQuery, setNlQuery] = useState("");
  const [nlLoading, setNlLoading] = useState(false);

  function toggleType(value: string) {
    const next = filters.facilityTypes.includes(value)
      ? filters.facilityTypes.filter((v) => v !== value)
      : [...filters.facilityTypes, value];
    onChange({ ...filters, facilityTypes: next });
  }

  async function runNl() {
    if (!nlQuery.trim()) return;
    setNlLoading(true);
    try {
      const partial = await nlSearch(nlQuery);
      onChange({ ...DEFAULT_FILTERS, ...partial });
      toast.success("Filters updated by AI", {
        description: nlQuery,
      });
    } catch (e) {
      toast.error("AI search failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setNlLoading(false);
    }
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-panel">
      <div className="border-b border-border p-4 space-y-3">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          AI Search Intent
        </Label>
        <div className="relative">
          <Sparkles className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-primary" />
          <Input
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runNl()}
            placeholder="Emergency trauma in Bihar"
            className="pl-8 bg-background/60 font-mono text-xs"
          />
        </div>
        <Button
          onClick={runNl}
          disabled={nlLoading || !nlQuery.trim()}
          className="w-full"
          size="sm"
        >
          {nlLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Search with AI
        </Button>
      </div>

      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="space-y-6 p-4">
          <section>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Facility Type
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FACILITY_TYPE_OPTIONS.map((o) => {
                const active = filters.facilityTypes.includes(o.value);
                return (
                  <button
                    key={o.value}
                    onClick={() => toggleType(o.value)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs transition-colors",
                      active
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/30",
                    )}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Min Trust Score
              </Label>
              <span className="font-mono text-xs text-foreground">
                {filters.minTrust.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[filters.minTrust]}
              max={1}
              step={0.05}
              onValueChange={(v) => onChange({ ...filters, minTrust: v[0] })}
            />
            <div className="h-1.5 rounded-full bg-trust-gradient opacity-60" />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Tavily-verified only</Label>
              <Switch
                checked={filters.onlyVerified}
                onCheckedChange={(v) => onChange({ ...filters, onlyVerified: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Only anomalies</Label>
              <Switch
                checked={filters.onlyAnomalies}
                onCheckedChange={(v) => onChange({ ...filters, onlyAnomalies: v })}
              />
            </div>
          </section>

          <section>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              States ({states.length})
            </Label>
            <div className="mt-2 space-y-1">
              {filters.state && (
                <button
                  onClick={() => onChange({ ...filters, state: null })}
                  className="w-full rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-left text-xs text-primary"
                >
                  Clear state filter ({filters.state})
                </button>
              )}
              {states.slice(0, 25).map((s) => {
                const active = filters.state?.toLowerCase() === s.state?.toLowerCase();
                return (
                  <button
                    key={s.state}
                    onClick={() => onChange({ ...filters, state: active ? null : s.state })}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md border px-2 py-1 text-left text-xs transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-transparent hover:border-border hover:bg-card/60",
                    )}
                  >
                    <span className="truncate text-foreground">{s.state}</span>
                    <Badge variant="outline" className="h-4 border-border px-1 font-mono text-[10px]">
                      {s.facility_count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="w-full rounded-md border border-border bg-background/40 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset all filters
          </button>
        </div>
      </ScrollArea>
    </aside>
  );
}
