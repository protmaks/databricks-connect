import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Facility } from "@/lib/types";
import { facilityCapabilities, trustBadge } from "@/lib/trust";
import { deepResearch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AgentPanelProps {
  facility: Facility | null;
  onClose: () => void;
}

function TrustGauge({ score }: { score: number }) {
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - score * circ;
  const color = score >= 0.7 ? "hsl(var(--trust-high))" : score >= 0.4 ? "hsl(var(--trust-mid))" : "hsl(var(--trust-low))";
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-xl font-semibold" style={{ color }}>
          {score.toFixed(2)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust</div>
      </div>
    </div>
  );
}

export function AgentDetailPanel({ facility, onClose }: AgentPanelProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runDeep() {
    if (!facility) return;
    setLoading(true);
    setReport(null);
    try {
      const r = await deepResearch(facility);
      setReport(r);
    } catch (e) {
      toast.error("Deep research failed", { description: e instanceof Error ? e.message : "Unknown" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {facility && (
        <motion.aside
          key={facility.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="z-30 flex h-full w-full min-w-0 flex-col border-l border-border bg-panel shadow-2xl"
          onAnimationComplete={() => setReport(null)}
        >
          {(() => {
            const badge = trustBadge(facility.trust_score);
            const caps = facilityCapabilities(facility);
            return (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                  <div className="min-w-0">
                    <Badge variant="outline" className={cn("mb-2 border", badge.cls)}>
                      {badge.label}
                    </Badge>
                    <h2 className="truncate text-base font-semibold">{facility.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {facility.facility_type} · {facility.district ?? "?"}, {facility.state ?? "?"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose} className="-mr-2 h-7 w-7">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 scrollbar-thin">
                  <div className="space-y-5 p-4">
                    <div className="flex items-center gap-4 rounded-md border border-border bg-card/40 p-3">
                      <TrustGauge score={facility.trust_score} />
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">Label: </span>
                          <span className="font-mono">{facility.trust_label}</span>
                          {facility.tavily_updated_trust_score &&
                            facility.original_trust_label &&
                            facility.tavily_updated_trust_score !== facility.original_trust_label && (
                              <span className="ml-1 text-muted-foreground/70">
                                (was {facility.original_trust_label})
                              </span>
                            )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Capacity: </span>
                          <span className="font-mono">{facility.capacity ?? "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Doctors: </span>
                          <span className="font-mono">{facility.doctors ?? "—"}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {facility.tavily_verified && (
                            <Badge variant="outline" className="border-trust-high/40 bg-trust-high/10 text-trust-high">
                              <ShieldCheck className="mr-1 h-3 w-3" />
                              Tavily verified
                            </Badge>
                          )}
                          {facility.is_suspicious === 1 && (
                            <Badge variant="outline" className="border-trust-low/40 bg-trust-low/10 text-trust-low">
                              Flagged suspicious
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {(facility.websites || facility.phone_numbers || facility.email) && (
                      <section className="space-y-1 text-xs">
                        {facility.websites && (
                          <div className="truncate">
                            <span className="text-muted-foreground">Web: </span>
                            <a
                              href={facility.websites.split(/[;, ]/)[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {facility.websites}
                            </a>
                          </div>
                        )}
                        {facility.phone_numbers && (
                          <div className="truncate">
                            <span className="text-muted-foreground">Phone: </span>
                            <span className="font-mono">{facility.phone_numbers}</span>
                          </div>
                        )}
                        {facility.email && (
                          <div className="truncate">
                            <span className="text-muted-foreground">Email: </span>
                            <span className="font-mono">{facility.email}</span>
                          </div>
                        )}
                      </section>
                    )}

                    {caps.length > 0 && (
                      <section>
                        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                          Capabilities
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {caps.map((c) => (
                            <Badge key={c} variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </section>
                    )}

                    {facility.specialties && (
                      <section>
                        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                          Specialties
                        </div>
                        <p className="text-xs text-foreground/90">{facility.specialties}</p>
                      </section>
                    )}

                    <section>
                      <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                        Agent Reasoning Log
                      </div>
                      <pre className="whitespace-pre-wrap rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
{facility.reasoning ?? "(no reasoning recorded)"}
                      </pre>
                    </section>

                    {facility.missing_evidence && facility.missing_evidence.length > 0 && (
                      <section>
                        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-trust-low">
                          Contradictions / Missing Evidence
                        </div>
                        <ul className="space-y-1 text-xs">
                          {facility.missing_evidence.map((m, i) => (
                            <li key={i} className="flex gap-2 rounded-md border border-trust-low/20 bg-trust-low/5 p-2">
                              <span className="text-trust-low">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {facility.supporting_evidence && facility.supporting_evidence.length > 0 && (
                      <section>
                        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-trust-high">
                          Supporting Evidence
                        </div>
                        <ul className="space-y-1 text-xs">
                          {facility.supporting_evidence.slice(0, 5).map((m, i) => (
                            <li key={i} className="flex gap-2 rounded-md border border-trust-high/20 bg-trust-high/5 p-2">
                              <span className="text-trust-high">✓</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {facility.tavily_evidence_urls && facility.tavily_evidence_urls.length > 0 && (
                      <section>
                        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-trust-high">
                          <ShieldCheck className="h-3 w-3" />
                          Tavily Evidence
                          {facility.last_tavily_check_date && (
                            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                              {facility.last_tavily_check_date}
                            </span>
                          )}
                        </div>
                        <ul className="space-y-1.5 text-xs">
                          {facility.tavily_evidence_urls.slice(0, 5).map((url, i) => (
                            <li
                              key={i}
                              className="rounded-md border border-trust-high/20 bg-trust-high/5 p-2"
                            >
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 truncate text-trust-high hover:underline"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0" />
                                <span className="truncate">{url}</span>
                              </a>
                              {facility.tavily_evidence_snippets?.[i] && (
                                <p className="mt-1 text-[11px] leading-snug text-foreground/80">
                                  {facility.tavily_evidence_snippets[i]}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <div className="space-y-2 border-t border-border pt-4">
                      <div>
                        <Button onClick={runDeep} disabled={loading} className="w-full" variant="default">
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          Run Deep Research
                        </Button>
                        <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                          Launches an LLM agent that pulls live web evidence (Tavily) and generates a fresh trust brief for this facility.
                        </p>
                      </div>
                      <div>
                        <Button variant="outline" className="w-full" disabled>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View MLflow Trace
                        </Button>
                        <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                          Opens the MLflow run that produced this facility's trust score (coming soon).
                        </p>
                      </div>
                    </div>

                    {report && (
                      <motion.section
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-md border border-primary/30 bg-primary/5 p-3"
                      >
                        <div className="mb-2 text-[11px] uppercase tracking-wider text-primary">
                          Deep Research Brief
                        </div>
                        <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">
                          {report}
                        </div>
                      </motion.section>
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
