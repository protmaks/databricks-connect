## Problem

Right now every filter change fires 3 SQL queries to Databricks (`facilities-aggregate` runs kpi+states+points in parallel) plus 1 to `facilities-list`. With 10k rows, every checkbox toggle means 4 round-trips to Databricks (~2–5 seconds each).

Meanwhile, the data in the Gold table changes rarely (Tavily enrichment runs in batches, not in realtime).

## Solution: 3 cache layers

### Layer 1 — Server-side cache in Edge Functions (the main one)

Add an in-memory LRU cache for `runSql()` in `_shared/databricks.ts`:
- key = hash of `statement + params`
- TTL = **5 minutes** (configurable via env `CACHE_TTL_SECONDS`)
- max 100 entries per instance

Supabase Edge Function instances live for several minutes between cold starts, so repeated requests with the same filters from any client come back in ~50 ms instead of 2–5 s.

Also add a `Cache-Control: public, max-age=60, stale-while-revalidate=300` header — the browser/CDN cache the response on top.

### Layer 2 — Load everything once, filter on the client

10k rows is ~3–5 MB of JSON. That's fine for a single load.

Strategy:
1. New Edge Function `facilities-snapshot` — returns **all** ~10k facilities in one query without filters (with the 5-minute server cache).
2. On the client, drop it into React Query with `staleTime: 5 * 60_000` and `gcTime: 30 * 60_000`.
3. All filters (`facilityTypes`, `minTrust`, `state`, `search`, `onlyAnomalies`, `onlyVerified`) are applied **in the browser** via `useMemo` — instant, no network calls.
4. KPIs and per-state aggregates are computed on the client from the same array.

Pros: filters react instantly, Databricks is hit ~once every 5 minutes per user.

Cons: the first load is a bit longer (~1.5–3 s for 10k). This is masked by a skeleton, and everything flies after that.

### Layer 3 — React Query settings in `App.tsx`

Right now `QueryClient` has no configuration. Add:
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,      // data is considered fresh for 5 minutes
      gcTime: 30 * 60_000,         // keep in memory for 30 minutes
      refetchOnWindowFocus: false, // don't refetch when tab regains focus
      retry: 1,
    },
  },
});
```

Plus persistence via `localStorage` (`@tanstack/query-sync-storage-persister` + `persistQueryClient`) — on page reload data comes straight from localStorage, with a background refetch after 5 minutes.

## Files that change

**Backend:**
- `supabase/functions/_shared/databricks.ts` — add `cachedRunSql()` with a Map-based LRU + TTL.
- `supabase/functions/facilities-snapshot/index.ts` — **new** function: a single SELECT of all columns with no filter WHERE clause, only the basics (lat/lon NOT NULL). Limit 15000.
- `supabase/functions/facilities-aggregate/index.ts` and `facilities-list/index.ts` — kept as a fallback, but switched to `cachedRunSql` (for compatibility and in case anyone needs server-side filtering).

**Frontend:**
- `src/lib/api.ts` — new `fetchSnapshot()` function, plus client-side helpers `filterFacilities()`, `aggregateKpi()`, `aggregateStates()`, `aggregatePoints()`.
- `src/pages/Index.tsx` — a single `useQuery(['snapshot'])`, everything else through `useMemo(filters → filtered data)`.
- `src/App.tsx` — `QueryClient` settings plus optional `persistQueryClient` in localStorage.
- `package.json` — add `@tanstack/query-sync-storage-persister` and `@tanstack/react-query-persist-client` (~3 KB).

**NL-search and deep-research** don't need to be touched — they're already rare and contextual.

## Result

| Action | Before | After |
|---|---|---|
| First load | 4–8 s (4 requests) | 2–4 s (1 request) |
| Filter change | 4–8 s | <50 ms (memoized) |
| Returning to the page | 4–8 s | instant (localStorage) |
| Load on Databricks | every click | ~1 request / 5 min / user |

## Options worth discussing

1. **Server cache TTL** — 5 min is fine, or do you want more/less? If the data refreshes hourly, I'll set it to 30 min.
2. **Persist in localStorage** — turn it on or not? (pro: instant startup; con: ~3 MB in the user's localStorage).
3. **If the table grows to 100k+ in the future** — the snapshot won't work anymore, then we'll go back to server-side filtering, but the cache will still help. For 10k right now, this is the optimal path.
