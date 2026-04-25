import { motion } from "framer-motion";
import { Activity, AlertTriangle, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import type { KpiSummary } from "@/lib/types";
import { formatNumber } from "@/lib/trust";
import { cn } from "@/lib/utils";

interface KpiHeaderProps {
  kpi: KpiSummary | null;
  loading: boolean;
}

const cards = [
  {
    key: "total_facilities" as const,
    label: "Facilities Mapped",
    icon: Stethoscope,
    accent: "text-foreground",
    glow: "",
  },
  {
    key: "states_covered" as const,
    label: "States Covered",
    icon: MapPin,
    accent: "text-accent",
    glow: "",
  },
  {
    key: "avg_trust" as const,
    label: "Avg Trust Score",
    icon: ShieldCheck,
    accent: "text-trust-high",
    glow: "",
    fmt: (v: number) => v.toFixed(2),
  },
  {
    key: "anomalies" as const,
    label: "Anomalies Detected",
    icon: AlertTriangle,
    accent: "text-trust-low",
    glow: "",
  },
];

export function KpiHeader({ kpi, loading }: KpiHeaderProps) {
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
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4 max-w-3xl">
          {cards.map((c, i) => {
            const value = kpi ? (kpi as Record<string, number>)[c.key] : 0;
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
      </div>
    </header>
  );
}
