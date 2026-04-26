import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MatchResult, QueryPlan } from "@/lib/agentSearch";
import { planSummary } from "@/lib/agentSearch";
import type { Facility } from "@/lib/types";

interface AiMatchesPanelProps {
  plan: QueryPlan | null;
  results: MatchResult[];
  query: string;
  onClose: () => void;
  onSelect: (f: Facility) => void;
}

export function AiMatchesPanel({ plan, results, query, onClose, onSelect }: AiMatchesPanelProps) {
  return (
    <AnimatePresence>
      {plan && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="absolute right-0 top-0 z-20 flex h-full w-[380px] flex-col border-l border-border bg-panel/95 backdrop-blur"
        >
          <header className="flex items-start justify-between gap-2 border-b border-border p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                AI Multi-Attribute Match
              </div>
              <p className="mt-1 truncate font-mono text-xs text-foreground" title={query}>
                {query}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {planSummary(plan)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {plan.capabilities.map((c) => (
                  <Badge key={c} variant="outline" className="h-4 border-primary/40 bg-primary/10 px-1.5 text-[9px] uppercase text-primary">
                    {c}
                  </Badge>
                ))}
                {plan.softSignals.map((s) => (
                  <Badge key={s} variant="outline" className="h-4 border-border px-1.5 text-[9px] text-muted-foreground">
                    {s}
                  </Badge>
                ))}
                {plan.intent === "nearest" && (
                  <Badge variant="outline" className="h-4 border-accent/50 bg-accent/10 px-1.5 text-[9px] uppercase text-accent">
                    nearest
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="space-y-2 p-3">
              {results.length === 0 && (
                <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No facilities matched even partially. Try loosening the query.
                </div>
              )}
              {results.map((m, i) => (
                <button
                  key={m.facility.id}
                  onClick={() => onSelect(m.facility)}
                  className={cn(
                    "group w-full rounded-md border p-3 text-left transition-colors",
                    m.partial
                      ? "border-warning/40 bg-warning/5 hover:border-warning/70"
                      : "border-success/40 bg-success/5 hover:border-success/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                        <h4 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                          {m.facility.name}
                        </h4>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">
                          {m.facility.district ? `${m.facility.district}, ` : ""}
                          {m.facility.state ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-mono text-sm font-bold text-primary">
                        {Math.round(m.score)}
                      </div>
                      {m.distanceKm !== null && (
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {m.distanceKm.toFixed(0)} km
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.matched.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded border border-success/40 bg-success/10 px-1 py-0.5 text-[9px] text-success"
                      >
                        <CheckCircle2 className="h-2 w-2" />
                        {tag}
                      </span>
                    ))}
                    {m.missing.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded border border-warning/40 bg-warning/10 px-1 py-0.5 text-[9px] text-warning"
                      >
                        <AlertCircle className="h-2 w-2" />
                        no {tag}
                      </span>
                    ))}
                  </div>

                  {m.partial && (
                    <p className="mt-1.5 text-[10px] italic text-warning/80">
                      Partial match — {m.missing.length} criteria unmet
                    </p>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
