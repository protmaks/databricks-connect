## Что строим

Современный dark-mode дашборд "Medical Intelligence Network" поверх таблицы `healthcare.silver.facility_intelligence` в Databricks. Главный экран — интерактивная 3D-карта Индии с гексагонами H3, где высота = совокупная вместимость учреждений, а цвет = средний AI Trust Score. При клике открывается панель с reasoning-логом ИИ-агента.

## Шаг 0 — Инспекция данных (выполняется первым делом)

1. Привязать к проекту коннектор **Free Databricks**.
2. Через connector gateway выполнить:
   - `DESCRIBE TABLE healthcare.silver.facility_intelligence` — узнать реальные имена/типы колонок.
   - `SELECT * FROM healthcare.silver.facility_intelligence LIMIT 5` — посмотреть примеры значений.
   - `SELECT COUNT(*), COUNT(DISTINCT state), MIN(trust_score), MAX(trust_score) ...` — оценить объём и распределения.
3. По результатам подобрать маппинг полей (lat/lon, h3_index, trust_score, capacity, name, type, reasoning, trace_url) и при необходимости скорректировать остальные шаги. Если каких-то полей нет (например, h3_index или reasoning) — обсудим, как достроить (вычислить h3 на лету / оставить пустым / fallback).

## Шаг 1 — Backend (Edge Functions через Lovable Cloud)

Включаем Lovable Cloud. Создаём три edge-функции, ходящие в Databricks SQL API через connector gateway:

- **`databricks-warehouses`** — `GET /2.0/sql/warehouses`. Возвращает список SQL warehouses, чтобы выбрать первый запущенный (или закэшировать ID в env).
- **`facilities-list`** — выполняет SQL вида:
  ```sql
  SELECT id, name, lat, lon, h3_index, corrected_type, capacity,
         trust_score, last_update, reasoning, trace_url, state
  FROM healthcare.silver.facility_intelligence
  WHERE (:type IS NULL OR corrected_type = :type)
    AND trust_score >= :min_score
  ```
  Параметры: тип учреждения, минимальный Trust Score, bbox карты (опц.). Возвращает массив для рендера.
- **`facilities-aggregate`** — агрегация по H3-гексагонам для карты:
  ```sql
  SELECT h3_index, SUM(capacity) AS total_capacity,
         AVG(trust_score) AS avg_trust, COUNT(*) AS facility_count
  FROM healthcare.silver.facility_intelligence
  GROUP BY h3_index
  ```
  Если `h3_index` нет в исходных данных — считаем на сервере из (lat, lon) с помощью `h3-js`.
- **`nl-search`** — принимает естественно-языковой запрос ("Find verified surgeons in rural Bihar"), через Lovable AI Gateway (`google/gemini-2.5-flash`) превращает в JSON-фильтры (state, type, min_trust, keywords) и вызывает `facilities-list`. Никакого raw SQL от LLM — только структурированный JSON.

Безопасность: валидация Zod на входе каждой функции, ограничение только SELECT, лимит на размер результата (топ-N).

## Шаг 2 — Frontend (React + Tailwind + shadcn)

**Layout:**
- Левый sidebar (collapsible) — фильтры и поиск.
- Центр — карта на весь экран.
- Правый sliding panel — детали выбранного объекта (открывается по клику).
- Верхний header — KPI-полоса.

**Header (KPI-карточки):**
- Total Facilities Mapped
- Total Capacity (beds)
- Average Trust Score (с цветным индикатором)
- Anomalies Detected (учреждения с trust_score < 0.4)

**Карта (`react-map-gl` + `deck.gl`):**
- Базовый слой: Mapbox dark style (`mapbox://styles/mapbox/dark-v11`), сфокусирован на Индии.
- `H3HexagonLayer` (3D, `extruded: true`): высота = `total_capacity`, цвет интерполируется красный→оранжевый→зелёный по `avg_trust`.
- `ScatterplotLayer` для индивидуальных клиник — включается при zoom > 9.
- Toggle "Show Medical Deserts" — отдельный слой, подсвечивающий гексагоны с низкой `total_capacity` относительно популяционной нормы (нужно либо поле популяции в данных, либо хардкод плотности по штатам как первый приближённый вариант).
- Hover tooltip с базовой инфой; click → открывает правую панель.

**Правая панель "Agentic Reasoning":**
- Заголовок: имя учреждения + бейдж "AI Verified" / "Suspicious".
- Trust Meter: круговой прогресс (SVG) со значением `trust_score`, цвет по порогам.
- Reasoning Log: текст из `reasoning` в карточке с моноширинным шрифтом, стиль "chain of thought".
- Список найденных противоречий (если в данных есть отдельное поле — иначе пропустим или сгенерируем на лету через AI на шаге расширения).
- Кнопка **"Deep Research"** — вызывает edge-функцию, которая через Lovable AI делает дополнительный анализ учреждения и возвращает обогащённый отчёт (имитация Tavily-агента, без внешних сервисов).
- Кнопка **"View MLflow Trace"** — открывает `trace_url` в новой вкладке.

**Sidebar (фильтры):**
- Поле NL Search ("Find me a verified surgeon in rural Bihar").
- Multi-select: тип учреждения (Hospital, AYUSH, Clinic, Diagnostic, Specialist).
- Slider: Minimum Trust Score (0—1).
- Toggle: Show Medical Deserts.
- Toggle: Show only anomalies.

**Дизайн:**
- Палитра в `index.css`: фон `#0A0E1A` (almost-black-navy), панели `#0F1729`, бордеры `#1F2937`, текст `#E5E7EB`. Акценты: зелёный `#10B981`, оранжевый `#F59E0B`, красный `#EF4444`. Все цвета через CSS-переменные и tokens в `tailwind.config.ts`.
- Шрифт: Inter (UI) + JJet Brains Mono (для reasoning-лога и метрик).
- Framer Motion на: появление панели, переходы KPI-чисел, fade слоёв карты.

## Шаг 3 — Что нужно от вас

- **Mapbox public token** (бесплатный аккаунт на mapbox.com → Tokens → Default public token). После запуска плана я попрошу его как secret.
- Если в таблице нет нужных полей — обсудим fallback после шага 0.

## Что НЕ делаем в этой итерации

- Авторизацию пользователей (доступ только у вас).
- Запись в Databricks (только read-only SELECT).
- Реальную интеграцию с Tavily/MLflow (кнопки работают, но содержимое генерируется через Lovable AI как имитация).
- Кэш в Lovable Cloud DB — каждый запрос идёт в Databricks напрямую.

## Порядок выполнения

1. Привязать Databricks, инспектировать схему таблицы.
2. Согласовать маппинг полей (короткое сообщение, если что-то не сходится).
3. Дизайн-система: цвета, шрифты, базовый layout.
4. Edge-функции `databricks-warehouses` + `facilities-list` + `facilities-aggregate`.
5. Карта с гексагонами + KPI-header.
6. Правая панель reasoning + детали.
7. Sidebar с фильтрами + NL search через Lovable AI.
8. Полировка: анимации, "Deep Research", Medical Deserts overlay.