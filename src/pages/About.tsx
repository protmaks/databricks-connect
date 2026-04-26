import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Github,
  Linkedin,
  Database,
  Brain,
  ShieldCheck,
  Map as MapIcon,
  Sparkles,
  FileSearch,
  FolderTree,
  Layers,
  Wand2,
  Telescope,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { PipelineStep } from "@/components/landing/PipelineStep";
import architectureDiagram from "@/assets/architecture-diagram.png";

const DATABRICKS_REPO = "https://github.com/protmaks/databricks_serving_a_nation";
const LINKEDIN_URL = "https://www.linkedin.com/in/protmaks/";

const About = () => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse-glow rounded-full bg-primary glow-emerald" />
            <span className="font-mono text-xs uppercase tracking-widest text-foreground">
              Medical Intelligence Network
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href={DATABRICKS_REPO} target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">Databricks repo</span>
              </a>
            </Button>
            <Button asChild size="sm">
              <Link to="/">
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, hsl(158 84% 39% / 0.18), transparent 70%), radial-gradient(40% 35% at 80% 30%, hsl(199 89% 48% / 0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Built on Databricks Free Edition
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl md:text-7xl"
          >
            From 10,000 buildings to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              one living network
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            India has world-class hospitals, but 70% of people live in rural
            areas where finding care is a puzzle. We turn fragmented facility
            data into a verified, AI-scored intelligence graph — so a postal
            code no longer decides a lifespan.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="glow-emerald">
              <Link to="/">
                Launch the dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={DATABRICKS_REPO} target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" />
                View Databricks pipeline
              </a>
            </Button>
          </motion.div>

          {/* Quick stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { v: "10K+", l: "Facilities" },
              { v: "70%", l: "Rural population" },
              { v: "Tavily", l: "Web evidence" },
              { v: "Free", l: "Databricks tier" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-lg border border-border bg-card/40 px-4 py-3 backdrop-blur"
              >
                <div className="font-mono text-2xl font-semibold text-primary">
                  {s.v}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-t border-border/60 bg-card/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="The problem"
            title="A discovery and coordination crisis"
            description="It is not just a lack of hospitals. Records are wrong, ICUs are missing, and patients travel for hours only to find empty wards."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Postal-code lottery",
                body: "Where you live often decides what care you can reach. Cities have everything; villages have outdated lists.",
              },
              {
                title: "Unstructured, untrusted data",
                body: "Facility records mix free-text notes, missing fields, and old surveys. A clinic may claim an ICU that does not exist.",
              },
              {
                title: "No web ground-truth",
                body: "Nobody cross-checks claims against real sources. Ambulances are dispatched on hope, not evidence.",
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur"
              >
                <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-destructive">
                  Problem 0{i + 1}
                </div>
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE BUILT */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="What we built"
            title="A backend that thinks. A frontend that explains."
            description="The heavy lifting runs in Databricks. The dashboard turns the result into a map you can actually use."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-panel p-7"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                <Database className="h-3.5 w-3.5" />
                Databricks backend
              </div>
              <h3 className="text-2xl font-semibold">The intelligence layer</h3>
              <ul className="mt-5 space-y-4">
                {[
                  {
                    icon: Layers,
                    title: "Bronze → Silver → Gold pipeline",
                    body: "Raw Excel files become clean, structured facility records.",
                  },
                  {
                    icon: Brain,
                    title: "Agentic enrichment",
                    body: "LLM extracts capabilities (ICU, trauma, surgery) from free-text notes.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Tavily web verification",
                    body: "Each claim is cross-checked against live web sources with citations.",
                  },
                  {
                    icon: Sparkles,
                    title: "Trust Score",
                    body: "Every facility gets a 0–1 score with evidence, missing fields, and reasoning.",
                  },
                ].map((it) => (
                  <li key={it.title} className="flex gap-3">
                    <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                      <it.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{it.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {it.body}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-panel p-7"
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-accent">
                <MapIcon className="h-3.5 w-3.5" />
                Lovable frontend
              </div>
              <h3 className="text-2xl font-semibold">The presentation layer</h3>
              <ul className="mt-5 space-y-4">
                {[
                  {
                    icon: MapIcon,
                    title: "3D hex map of India",
                    body: "10K facilities aggregated, anomalies highlighted in red.",
                  },
                  {
                    icon: FileSearch,
                    title: "AI Search Intent",
                    body: "Ask in plain English. The agent parses your query into structured filters.",
                  },
                  {
                    icon: Sparkles,
                    title: "Partial-match results",
                    body: "Never empty. We show the best 5 with matched and missing criteria.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Evidence panels",
                    body: "Open any facility to see Trust reasoning, Tavily snippets, and source links.",
                  },
                ].map((it) => (
                  <li key={it.title} className="flex gap-3">
                    <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
                      <it.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{it.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {it.body}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="border-t border-border/60 bg-card/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Architecture"
            title="One pipeline, five stages"
            description="Excel files in, an enriched, verified Gold table out — served straight to the Lovable app."
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mt-12 overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-2xl shadow-primary/5 sm:p-8"
          >
            <img
              src={architectureDiagram}
              alt="End-to-end architecture: Excel volume feeds Bronze → Silver → Gold → Discovery notebooks on Databricks, with Tavily web verification, served to the Lovable frontend through a Service Principal."
              className="mx-auto block w-full"
              loading="lazy"
            />
          </motion.div>
          <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-muted-foreground">
            Excel → Bronze → Silver → Gold → Discovery, with Tavily verification
            on the Gold layer and a Service Principal granting read-only access
            to the Lovable frontend.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <PipelineStep
              index={0}
              code="00 Init"
              title="Initialization"
              description="Bootstrap catalog, schemas, and the volume that holds raw Excel uploads."
              icon={FolderTree}
              delay={0}
            />
            <PipelineStep
              index={1}
              code="01 Bronze"
              title="Ingestion"
              description="Raw Excel rows land in the Bronze table, untouched and auditable."
              icon={Database}
              delay={0.05}
            />
            <PipelineStep
              index={2}
              code="02 Silver"
              title="Clean"
              description="Normalize, deduplicate, and parse structured columns from messy notes."
              icon={Layers}
              delay={0.1}
            />
            <PipelineStep
              index={3}
              code="03 Gold"
              title="Enrich + verify"
              description="Agentic LLM extracts capabilities. Tavily verifies them on the open web."
              icon={Wand2}
              delay={0.15}
            />
            <PipelineStep
              index={4}
              code="04 Discovery"
              title="Serve"
              description="The verified Gold table is exposed to Lovable via a Service Principal token."
              icon={Telescope}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* TRUST SCORE */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <SectionHeading
                eyebrow="Trust Score"
                title="Every facility, with receipts"
                description="No black box. Each score comes with the evidence the agent used, the fields that are missing, and direct links to the web sources Tavily found."
                align="left"
              />
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "0 to 1 score, computed on Databricks Gold layer",
                  "Anomaly flag when claims contradict the web",
                  "Reasoning log visible in the dashboard panel",
                  "Tavily snippets and URLs as citations",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-border bg-panel p-6 shadow-2xl shadow-primary/10"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Sample facility
                </span>
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                  Trust 0.82
                </span>
              </div>
              <h4 className="text-lg font-semibold">Rural Care Hospital</h4>
              <p className="text-xs text-muted-foreground">Bihar · Hospital</p>

              <div className="mt-5">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Matched
                </div>
                <div className="flex flex-wrap gap-2">
                  {["surgery", "emergency", "icu", "rural"].map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Missing
                </div>
                <div className="flex flex-wrap gap-2">
                  {["nicu"].map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                    >
                      <XCircle className="h-3 w-3" />
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  Tavily evidence
                </span>
                <p className="mt-1 leading-relaxed">
                  "Hospital website confirms 24/7 emergency surgery and ICU
                  wards. Pediatric NICU not listed."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI SEARCH UX */}
      <section className="border-t border-border/60 bg-card/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="UX highlight"
            title="Multi-attribute reasoning, in plain English"
            description="Type what you actually need. The agent parses it, ranks the whole snapshot, and never returns an empty list."
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-card/60 p-6 backdrop-blur"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              You ask
            </div>
            <p className="mt-2 text-base text-foreground">
              "Find the nearest facility in rural Bihar that can perform an
              emergency appendectomy and uses part-time doctors."
            </p>
            <div className="my-5 h-px bg-border" />
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              The agent plans
            </div>
            <div className="mt-2 grid gap-2 font-mono text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                type:{" "}
                <span className="text-foreground">hospital</span>
              </div>
              <div>
                state: <span className="text-foreground">Bihar</span>
              </div>
              <div>
                geo: <span className="text-foreground">rural anchor</span>
              </div>
              <div>
                caps:{" "}
                <span className="text-foreground">surgery, emergency</span>
              </div>
              <div className="sm:col-span-2">
                soft signals:{" "}
                <span className="text-foreground">"part-time doctors"</span>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
              Top 5 ranked by capability fit + proximity + trust. Anything
              missing is shown next to each card — so you know what the
              compromise is.
            </div>
          </motion.div>
        </div>
      </section>

      {/* FREE-TIER HONESTY */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Honest trade-offs"
            title="What Databricks Free can't do — and what we did instead"
            description="Free Edition does not include AI Model Serving, Mosaic AI Vector Search, or the Genie streaming UI. Here is how we worked around each gap."
          />
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-12 border-b border-border bg-card/60 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <div className="col-span-5">Not available on Free</div>
              <div className="col-span-7">Our workaround</div>
            </div>
            {[
              {
                gap: "Mosaic AI Vector Search",
                fix: "Client-side multi-attribute scoring in src/lib/agentSearch.ts (capabilities, proximity, soft signals).",
              },
              {
                gap: "AI Model Serving endpoints",
                fix: "Lovable AI Gateway (Gemini 2.5 Flash) called from Supabase Edge Functions.",
              },
              {
                gap: "Genie / streaming SQL",
                fix: "Cached SQL through edge functions with an in-memory LRU + TTL to absorb traffic.",
              },
              {
                gap: "MLflow Tracing UI",
                fix: "Reasoning + Tavily citations stored on each row and exposed in the detail panel.",
              },
            ].map((row, i) => (
              <div
                key={row.gap}
                className={`grid grid-cols-12 px-5 py-4 text-sm ${
                  i % 2 === 0 ? "bg-card/30" : "bg-card/10"
                }`}
              >
                <div className="col-span-5 font-medium text-foreground">
                  {row.gap}
                </div>
                <div className="col-span-7 text-muted-foreground">
                  {row.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="border-t border-border/60 bg-card/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading
            eyebrow="Tech stack"
            title="Built with open tools and free tiers"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Data",
                items: [
                  "Databricks Free Edition",
                  "Unity Catalog",
                  "Tavily web search",
                  "Service Principal auth",
                ],
              },
              {
                title: "Backend",
                items: [
                  "Supabase Edge Functions",
                  "Lovable AI Gateway",
                  "Gemini 2.5 Flash",
                  "In-memory LRU + TTL cache",
                ],
              },
              {
                title: "Frontend",
                items: [
                  "React 18 + Vite + TS",
                  "Tailwind CSS",
                  "deck.gl + MapLibre",
                  "Framer Motion + TanStack Query",
                ],
              },
            ].map((g) => (
              <div
                key={g.title}
                className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  {g.title}
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {g.items.map((it) => (
                    <li key={it} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + FOOTER */}
      <section className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(50% 60% at 50% 50%, hsl(158 84% 39% / 0.18), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Ready to explore the network?
          </h2>
          <p className="mt-4 text-muted-foreground">
            10,000 facilities, scored, verified, and on one map.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="glow-emerald">
              <Link to="/">
                Launch the dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={DATABRICKS_REPO} target="_blank" rel="noreferrer">
                <Github className="h-4 w-4" />
                Databricks repo
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div>
            Developed by{" "}
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-foreground hover:text-primary"
            >
              <Linkedin className="h-3.5 w-3.5" />
              Maksim Pachkouski
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={DATABRICKS_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              Databricks pipeline
            </a>
            <Link to="/" className="hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
