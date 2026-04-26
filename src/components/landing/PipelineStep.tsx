import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PipelineStepProps {
  index: number;
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

export const PipelineStep = ({
  index,
  code,
  title,
  description,
  icon: Icon,
  delay = 0,
}: PipelineStepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.45, delay }}
    className="relative flex flex-col rounded-xl border border-border bg-card/60 p-5 backdrop-blur"
  >
    <div className="mb-3 flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
        {code}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        0{index}
      </span>
    </div>
    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      {description}
    </p>
  </motion.div>
);
