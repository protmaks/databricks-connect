import { motion } from "framer-motion";
import { Activity, AlertTriangle, MapPin, RefreshCw, ShieldCheck, Stethoscope } from "lucide-react";
import type { KpiSummary } from "@/lib/types";
import { formatNumber } from "@/lib/trust";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KpiHeaderProps {
  kpi: KpiSummary | null;
  loading: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  lastUpdated?: number | null;
}

function formatAgo(ts: number | null | undefined): string {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

const cards = [
  {
    key: "total_facilities" as const,
    label: "Facilities",
    icon: Stethoscope,
    accent: "text-foreground",
  },
  {
    key: "verified_count" as const,
    label: "Tavily Verified",
    icon: ShieldCheck,
    accent: "text-trust-high",
  },
  {
    key: "avg_trust" as const,
    label: "Avg Trust Score",
    icon: Activity,
    accent: "text-accent",
    fmt: (v: number) => v.toFixed(2),
  },
  {
    key: "anomalies" as const,
    label: "Anomalies",
    icon: AlertTriangle,
    accent: "text-trust-low",
  },
  {
    key: "states_covered" as const,
    label: "States",
    icon: MapPin,
    accent: "text-foreground",
  },
];

export function KpiHeader({ kpi, loading, refreshing, onRefresh, lastUpdated }: KpiHeaderProps) {
  return (
    <header className="border-b border-border bg-panel/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-6 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight tracking-tight">
              Medical Intelligence Network
            </h1>
            <p className="text-xs text-muted-foreground">
              India healthcare graph · Trust Score by Agentic AI
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/protmaks/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Maksim Pachkouski
              </a>
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-5 max-w-4xl">
          {cards.map((c, i) => {
            const value = kpi ? (kpi[c.key] as number) : 0;
            const formatted = c.fmt ? c.fmt(value) : formatNumber(value);
            const Icon = c.icon;
            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-md border border-border bg-card/60 px-3 py-2"
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>{c.label}</span>
                  <Icon className={cn("h-3.5 w-3.5", c.accent)} />
                </div>
                <div
                  className={cn(
                    "font-mono text-lg font-semibold tabular-nums",
                    c.accent,
                    loading && "animate-pulse-glow",
                  )}
                >
                  {loading ? "—" : formatted}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col items-end gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing || !onRefresh}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span className="text-xs">Refresh</span>
          </Button>
          {lastUpdated ? (
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatAgo(lastUpdated)}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
