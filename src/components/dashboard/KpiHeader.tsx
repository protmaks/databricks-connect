import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, Info, MapPin, RefreshCw, ShieldCheck, Stethoscope } from "lucide-react";
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
      <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="flex items-center justify-between gap-3 md:justify-start">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight tracking-tight md:text-base">
                Medical Intelligence Network
              </h1>
              <p className="truncate text-[11px] text-muted-foreground md:text-xs">
                India healthcare · Trust Score by Agentic AI
              </p>
              <p className="mt-0.5 hidden text-[10px] text-muted-foreground md:block">
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
          {/* Mobile: About button next to title */}
          <Button
            asChild
            size="sm"
            className="h-8 shrink-0 gap-1.5 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/40 md:hidden"
          >
            <Link to="/about">
              <Info className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">About</span>
            </Link>
          </Button>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 md:gap-3 md:max-w-4xl">
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
                className="rounded-md border border-border bg-card/60 px-2 py-1.5 md:px-3 md:py-2"
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground md:text-[11px]">
                  <span className="truncate">{c.label}</span>
                  <Icon className={cn("h-3 w-3 shrink-0 md:h-3.5 md:w-3.5", c.accent)} />
                </div>
                <div
                  className={cn(
                    "font-mono text-base font-semibold tabular-nums md:text-lg",
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

        <div className="flex flex-row items-center justify-end gap-2 md:flex-col md:items-end md:gap-1.5">
          <Button
            asChild
            size="sm"
            className="hidden h-8 w-full gap-1.5 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.35)] md:inline-flex"
          >
            <Link to="/about">
              <Info className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">About / How it works</span>
            </Link>
          </Button>
          <div className="flex items-center justify-end gap-2 md:w-full">
            {lastUpdated ? (
              <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                {formatAgo(lastUpdated)}
              </span>
            ) : null}
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
          </div>
        </div>
      </div>
    </header>
  );
}
