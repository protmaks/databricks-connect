# Medical Intelligence Network — India

A real-time intelligence dashboard for India's healthcare facility graph, with **Trust Scores computed by Agentic AI** and verified through Tavily web evidence.

## 🧠 Where the heavy lifting happens

The **core data processing, agentic enrichment, and trust scoring pipeline** run inside **Databricks Free Edition**.
The Databricks workspace handles:

- Ingestion of raw facility data (hospitals, clinics, diagnostic centers, etc.)
- LLM-powered agentic enrichment (capability extraction, anomaly detection)
- Tavily web verification and evidence collection
- Trust Score computation and labeling
- Serving the curated table consumed by this app

🔗 **Databricks pipeline repository:** [github.com/protmaks/databricks_serving_a_nation](https://github.com/protmaks/databricks_serving_a_nation)

This Lovable app is the **presentation layer** — it queries Databricks via SQL through edge functions and renders an interactive map, KPIs, filters, and AI-powered natural language search.

## 🏗️ Architecture

```
┌──────────────────────────┐      ┌─────────────────────────┐      ┌────────────────────┐
│  Databricks Free Edition │ ───▶ │  Lovable Edge Functions │ ───▶ │  React Dashboard   │
│  (agentic pipeline +     │      │  (SQL gateway + cache)  │      │  (map, KPIs, NL    │
│   trust scoring)         │      │                         │      │   search, panels)  │
└──────────────────────────┘      └─────────────────────────┘      └────────────────────┘
```

### Frontend
- **React 18 + Vite + TypeScript**
- **Tailwind CSS** with semantic design tokens
- **deck.gl + MapLibre** for 3D hex aggregation and point overlays
- **Framer Motion** for animations
- **TanStack Query** for client-side caching

### Backend (Lovable Cloud)
- Edge functions proxy SQL to the Databricks SQL Warehouse
- In-memory LRU + TTL cache to absorb repeated traffic
- Lovable AI Gateway for natural-language query parsing and deep research reports

### Data layer
- **Databricks Free Edition** SQL Warehouse serving the enriched facility table
- All agentic enrichment logic lives in the Databricks repo linked above

## ✨ Features

- **Interactive map** with 3D hex aggregation, point clusters, and anomaly highlighting
- **KPI header** — facility count, verified count, average trust, anomalies, states covered
- **Filters** — facility type, minimum trust score, state, anomalies, Tavily verification
- **AI Search Intent** — natural language queries (e.g. *"I need a clinic in Delhi"*) parsed by an LLM into structured filters
- **Facility detail panel** with full trust evidence, citations, and on-demand deep research

## 🚀 Live

- **App:** [databricks-india-health.lovable.app](https://databricks-india-health.lovable.app)
- **Databricks pipeline:** [github.com/protmaks/databricks_serving_a_nation](https://github.com/protmaks/databricks_serving_a_nation)

## 🛠️ Self-hosting / Deploying anywhere

The frontend is a standard Vite + React SPA and can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, Nginx, etc.). The backend lives in Supabase Edge Functions and a Databricks SQL Warehouse.

### 1. Prerequisites

- **Node.js 20+** and **npm** (or `bun` / `pnpm`)
- A **Supabase** project (free tier works) — used for hosting the edge functions and serving as the API gateway
- A **Databricks** workspace (Free Edition is sufficient) with the enriched facility table from [databricks_serving_a_nation](https://github.com/protmaks/databricks_serving_a_nation)
- A **Lovable AI Gateway** key *or* an OpenAI-compatible key (for NL search and deep research)
- Optional: a **Tavily** API key (only if you want to run verification yourself; the dashboard reads pre-computed results)

### 2. Clone and install

```bash
git clone <your-fork-url>
cd <project-folder>
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-ref>
```

In your Supabase project, set the following **edge function secrets**:

```
DATABRICKS_HOST=<your-workspace>.cloud.databricks.com
DATABRICKS_HTTP_PATH=/sql/1.0/warehouses/<warehouse-id>
DATABRICKS_TOKEN=<personal-access-token>
DATABRICKS_TABLE=<catalog.schema.table>
LOVABLE_API_KEY=<your-ai-gateway-key>   # or OPENAI_API_KEY
```

### 4. Deploy the edge functions

Install the Supabase CLI and deploy:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy facilities-snapshot
supabase functions deploy facilities-list
supabase functions deploy facilities-aggregate
supabase functions deploy facility-deep-research
supabase functions deploy nl-search
```

### 5. Build the frontend

```bash
npm run build
```

The static bundle is emitted to `dist/`.

### 6. Serve

Pick any static host. A few common options:

**Nginx** (`/etc/nginx/sites-available/medical-intel`):
```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /var/www/medical-intel/dist;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;   # SPA fallback
  }
}
```

**Vercel / Netlify / Cloudflare Pages:**
- Build command: `npm run build`
- Output directory: `dist`
- Set the three `VITE_*` variables in the host's environment settings

**Docker** (minimal example):
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### 7. Verify

Open the deployed URL — the dashboard should load KPIs and render the map. If the map is empty, check the browser network tab for errors from `facilities-snapshot` and confirm the Databricks secrets are set correctly in Supabase.

## 👤 Author

Developed by [**Maksim Pachkouski**](https://www.linkedin.com/in/protmaks/)
