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

## 👤 Author

Developed by [**Maksim Pachkouski**](https://www.linkedin.com/in/protmaks/)
