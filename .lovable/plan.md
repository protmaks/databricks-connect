## Проблема

Сейчас на каждое изменение фильтра летят 3 SQL-запроса в Databricks (`facilities-aggregate` делает kpi+states+points параллельно) + 1 на `facilities-list`. При 10k строк и любом тычке в чекбокс — это 4 round-trip'а в Databricks (~2–5 сек каждый).

При этом данные в Gold-таблице меняются редко (Tavily-обогащение идёт батчами, не в realtime).

## Решение: 3 уровня кеша

### Уровень 1 — Серверный кеш в Edge Functions (главное)

В `_shared/databricks.ts` добавить in-memory LRU-кеш для `runSql()`:
- ключ = хеш `statement + params`
- TTL = **5 минут** (настраивается через env `CACHE_TTL_SECONDS`)
- макс. 100 записей в памяти инстанса

Edge Function instance в Supabase живёт несколько минут между cold-start'ами, так что повторные запросы с одинаковыми фильтрами от любого клиента вернутся за ~50 мс вместо 2–5 сек.

Также добавить заголовок `Cache-Control: public, max-age=60, stale-while-revalidate=300` — браузер/CDN ещё раз кешируют ответ.

### Уровень 2 — Загрузить ВСЁ один раз, фильтровать на клиенте

10k строк — это ~3–5 МБ JSON. Это нормально для одной загрузки.

Стратегия:
1. Новая Edge Function `facilities-snapshot` — отдаёт **все** ~10k фасилити одним запросом без фильтров (с серверным кешем на 5 мин).
2. На клиенте кладём это в React Query с `staleTime: 5 * 60_000` и `gcTime: 30 * 60_000`.
3. Все фильтры (`facilityTypes`, `minTrust`, `state`, `search`, `onlyAnomalies`, `onlyVerified`) применяются **в браузере** через `useMemo` — мгновенно, без сетевых запросов.
4. KPI и агрегаты по штатам тоже считаются на клиенте из этого же массива.

Плюсы: фильтры реагируют моментально, Databricks дёргается ~раз в 5 минут на пользователя.

Минусы: первая загрузка чуть дольше (~1.5–3 сек на 10k). Это компенсируется skeleton'ом и тем, что дальше всё летает.

### Уровень 3 — React Query настройки в `App.tsx`

Сейчас `QueryClient` без конфигурации. Добавить:
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,      // 5 минут считаем данные свежими
      gcTime: 30 * 60_000,         // храним в памяти 30 минут
      refetchOnWindowFocus: false, // не дёргать при возврате на вкладку
      retry: 1,
    },
  },
});
```

Плюс persistence через `localStorage` (`@tanstack/query-sync-storage-persister` + `persistQueryClient`) — при перезагрузке страницы данные сразу из localStorage, фоновый refetch через 5 мин.

## Что меняется в файлах

**Backend:**
- `supabase/functions/_shared/databricks.ts` — добавить `cachedRunSql()` с Map-based LRU + TTL.
- `supabase/functions/facilities-snapshot/index.ts` — **новая** функция: один SELECT всех колонок без WHERE по фильтрам, только базовые (lat/lon NOT NULL). Лимит 15000.
- `supabase/functions/facilities-aggregate/index.ts` и `facilities-list/index.ts` — оставляем как fallback, но переключаем на `cachedRunSql` (для совместимости + если кому-то понадобится server-side фильтрация).

**Frontend:**
- `src/lib/api.ts` — новая функция `fetchSnapshot()`, плюс клиентские хелперы `filterFacilities()`, `aggregateKpi()`, `aggregateStates()`, `aggregatePoints()`.
- `src/pages/Index.tsx` — один `useQuery(['snapshot'])`, всё остальное через `useMemo(filters → отфильтрованные данные)`.
- `src/App.tsx` — настройки `QueryClient` + опциональный `persistQueryClient` в localStorage.
- `package.json` — добавить `@tanstack/query-sync-storage-persister` и `@tanstack/react-query-persist-client` (~3 КБ).

**NL-search и deep-research** трогать не нужно — они и так редкие и контекстные.

## Результат

| Действие | Сейчас | После |
|---|---|---|
| Первая загрузка | 4–8 сек (4 запроса) | 2–4 сек (1 запрос) |
| Смена фильтра | 4–8 сек | <50 мс (мемоизация) |
| Возврат на страницу | 4–8 сек | мгновенно (localStorage) |
| Нагрузка на Databricks | каждый клик | ~1 запрос / 5 мин / пользователя |

## Опции, которые стоит обсудить

1. **TTL серверного кеша** — 5 мин ок, или хочешь больше/меньше? Если данные обновляются раз в час — поставлю 30 мин.
2. **Persist в localStorage** — включить или не надо? (плюс: моментальный старт; минус: ~3 МБ в localStorage пользователя).
3. **Если в будущем таблица вырастет до 100k+** — снапшот уже не сработает, тогда вернёмся к серверной фильтрации, но кеш всё равно поможет. Сейчас на 10k — оптимальный путь.