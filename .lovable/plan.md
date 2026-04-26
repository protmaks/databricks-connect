## Goal

Create a separate **English-language landing page** that explains the Medical Intelligence Network — India project: the problem, the Databricks backend pipeline (Bronze → Silver → Gold → Discovery), the AI/Tavily verification layer, and the Lovable frontend. The current `/` route stays as the live dashboard; the landing page is a new marketing/explainer page on its own route.

---

## 1. New route

- Add a new route `/about` in `src/App.tsx` that renders a new page `src/pages/About.tsx`.
- Add a small "About / How it works" link in the dashboard header (top-right of `src/pages/Index.tsx`) so users can reach the landing page from the dashboard.
- The landing page itself will have a "Launch dashboard" CTA button that links back to `/`.

## 2. Architecture diagram asset

- Copy the uploaded screenshot (`Screenshot_2026-04-26_at_14.14.33.png`) into `src/assets/architecture-diagram.png` (already done during planning) and import it as an ES module in the landing page.
- It will be displayed full-width in the "Architecture" section with a dark backdrop and a subtle border so the white screenshot blends with the dark theme. A short caption underneath will name each stage (Excel → Bronze → Silver → Gold → Discovery → Lovable).

## 3. Page structure (`src/pages/About.tsx`)

The landing page will reuse the existing dark-navy / neon-emerald design tokens from `src/index.css` (no new colors). It will be a single scrolling page composed of these sections:

1. **Hero**
   - Headline: "Medical Intelligence Network — India"
   - Subheadline: "Turning 10,000+ healthcare facilities into a living, verified intelligence graph."
   - Two buttons: **Launch Dashboard** (`/`) and **View Databricks Repo** (external link to `github.com/protmaks/databricks_serving_a_nation`).
   - Animated gradient background using existing `--gradient-panel` and `--glow-emerald`.

2. **The Problem**
   - Three short cards explaining: postal-code lottery, fragmented unstructured data, discovery & coordination crisis.
   - Stat badges: "10,000+ facilities", "70% rural population", "Multiple unverified sources".

3. **What We Built**
   - Two-column layout: left = "Databricks Backend" (data pipeline + agentic enrichment + Tavily verification + Trust Score), right = "Lovable Frontend" (3D map, NL search, partial-match results, evidence panels).
   - Each side has a bullet list with icons (lucide-react: `Database`, `Brain`, `ShieldCheck`, `Map`, `Sparkles`, `FileSearch`).

4. **Architecture**
   - Full-width image of the architecture diagram (`src/assets/architecture-diagram.png`).
   - Below the image: a 5-step horizontal timeline with the same stage names and a one-sentence description per stage:
     - **00 Initialization** — bootstrap catalog, schemas, volume.
     - **01 Bronze Ingestion** — raw Excel data ingested into Bronze table.
     - **02 Silver Clean** — cleaning, normalization, structured columns from unstructured notes.
     - **03 Gold Populate** — agentic enrichment + Tavily web verification → Trust Score.
     - **04 Discovery** — final Gold table exposed via Service Principal to the Lovable app.

5. **Trust Score & Tavily Verification**
   - Explain in plain English how each facility gets a Trust Score, how Tavily provides web evidence, and how the UI shows citations and reasoning logs.
   - Mini example "card" mockup showing a fake facility with matched / missing criteria badges (reusing the same visual language as `AiMatchesPanel`).

6. **AI-Powered Search (UX highlight)**
   - Describe how a natural-language question is parsed into a `QueryPlan` (facility type, capabilities, geo anchor, soft signals) and ranked client-side against the snapshot.
   - Mention the **Partial Match** philosophy: "If nothing is perfect, we still show the best 5 and tell you what is missing."
   - Note that **Mosaic AI Vector Search is not available in Databricks Free Edition**, so the matching runs in the browser via `src/lib/agentSearch.ts`.

7. **Free-Tier Honesty section** ("What we couldn't use, and how we worked around it")
   - Short, honest table:
     - Mosaic AI Vector Search → client-side scoring in `agentSearch.ts`.
     - Model Serving endpoints → Lovable AI Gateway (Gemini 2.5 Flash) via edge functions.
     - MLflow Tracing UI → planned, currently a placeholder.
     - Genie / streaming SQL → cached SQL through Supabase edge functions with in-memory LRU + TTL.

8. **Tech Stack**
   - Three small grouped cards: **Data** (Databricks Free Edition, Unity Catalog, Tavily), **Backend** (Supabase Edge Functions, Lovable AI Gateway), **Frontend** (React 18, Vite, Tailwind, deck.gl, MapLibre, Framer Motion, TanStack Query).

9. **Footer / CTA**
   - "Built by Maksim Pachkouski" with LinkedIn link.
   - Repo links: Databricks repo + Lovable frontend repo.
   - Final big "Launch the Dashboard" button.

## 4. Implementation details

- New files:
  - `src/pages/About.tsx` — the landing page.
  - `src/components/landing/SectionHeading.tsx` — small reusable heading component (eyebrow + title + description) to keep section markup tidy.
  - `src/components/landing/PipelineStep.tsx` — one stage of the architecture timeline.
- Edited files:
  - `src/App.tsx` — register `<Route path="/about" element={<About />} />` above the catch-all.
  - `src/pages/Index.tsx` — add a small "About" link/button in the header area linking to `/about`.
- All animations via Framer Motion (already a dependency), reusing fade/slide patterns from `AgentDetailPanel`.
- All copy in **English** with simple B1-level phrasing, matching the tone of the existing video script.
- Fully responsive: sections stack on mobile, two-column blocks become single-column under `md:`.
- No new dependencies required.

## 5. Out of scope

- No backend / database changes.
- No edits to edge functions.
- No changes to existing dashboard behavior beyond adding the "About" link.
