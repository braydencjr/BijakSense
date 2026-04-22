# MerchantMind — Team Task Distribution
> **UMHackathon 2026** · 4-member team · Python 3.11 + FastAPI + Z.AI GLM + A2A Architecture

---

## How the system works (read first)

```
Frontend (React/Vite)
    │
    ├── GET  /api/dashboard/{merchant_id}   → Dashboard.tsx  (KPIs, alerts)
    ├── POST /api/chat                      → Chat.tsx        (conversational co-pilot)
    ├── GET  /api/recommendations           → Recommendations.tsx
    └── GET  /api/signals                   → IntelligenceMap.tsx
           │
           ▼
     FastAPI  (backend/main.py)
           │
           ▼
     OrchestratorAgent  (agents/orchestrator.py)
       ├── routes signals → primary specialist agent
       ├── A2A broadcast  → all four agents answer in parallel
       └── synthesises    → one coherent chat response
           │
    ┌──────┬──────┬──────┐
    ▼      ▼      ▼      ▼
 Inv.   Mkt.   Loc.   Ops
Planner Analyst Scout Advisor
```

Each specialist agent:
1. Has an `analyze(signal, merchant)` method → returns domain-specific JSON recommendation
2. Has a `query(question, merchant, history, context)` method → returns chat text
3. Has a `_consult(context)` method → called by the orchestrator during broadcast

The Orchestrator sits above all four and glues them together.

---

## Critical Data Contracts (must match frontend exactly)

The frontend's `src/data/mock.ts` defines the exact shapes the frontend expects.  
**Your API responses must produce these field names and value types.**

### Alert / Recommendation card
```typescript
{
  id:       string,           // "alt_1"
  agent:    string,           // "Inventory Planner" | "Market Analyst" | "Location Scout" | "Ops Advisor"
  urgency:  string,           // "red" | "amber" | "green" | "teal"  (frontend urgency vocab)
  headline: string,           // one-line summary shown on card
  detail:   string,           // supporting explanation
  time:     string,           // "45 mins ago" | human-readable
  status:   string,           // "pending" | "acted_on" | "dismissed"
}
```

### World Signal
```typescript
{
  id:              string,
  type:            string,    // "Disruption" | "Commodity" | "Trend" | "Supply Chain" | "Real Estate"
  origin:          string,    // human-readable place name
  coords:          { lat: number, lng: number },
  summary:         string,
  impact:          string,    // "↓ supply" | "↑ cost" | "↑ demand" | "↑ competition"
  urgency:         string,    // "red" | "amber" | "teal"
  agentProcessing: string,    // "Inventory Planner" | "Market Analyst" | "Location Scout"
}
```

### Agent status (for the map sidebar)
```typescript
{
  id:         string,   // "inventory" | "market" | "ops" | "location"
  name:       string,   // "Inventory Planner" | "Market Analyst" | "Ops Advisor" | "Location Scout"
  status:     string,   // "processing" | "idle" | "alert"
  statusText: string,   // short description of current task
}
```

> **Backend urgency vocab vs frontend:**  
> The agent's internal urgency is `urgent | watch | opportunity | info`.  
> The dashboard router **maps** these to frontend colours: `urgent→red`, `watch→amber`, `opportunity→teal`, `info→green`.  
> This mapping already lives in `routers/dashboard.py`. Do not change it.

---

## Backend Project Structure

```
backend/
├── main.py                  # FastAPI app, CORS, middleware, router registration
├── config.py                # Pydantic settings (env vars, Z.AI URL, DB URL, Redis)
├── database.py              # SQLAlchemy async engine + get_db dependency
├── redis_client.py          # Redis connection + helpers
├── celery_app.py            # Celery worker config (background tasks)
├── mcp_server.py            # MCP tool interface (placeholder definitions for all agents)
├── seed_demo.py             # Seeds Siti's demo data into the DB
├── requirements.txt
├── alembic.ini
├── docker-compose.yml       # PostgreSQL + Redis services
│
├── agents/
│   ├── __init__.py
│   ├── base.py              # A2AAgent ABC, A2AMessage TypedDict, make_a2a_message()
│   ├── orchestrator.py      # Routes signals, broadcasts A2A, synthesises chat
│   ├── inventory_planner.py # ⬅ Member A
│   ├── market_analyst.py    # ⬅ Member B
│   ├── location_scout.py    # ⬅ Member C
│   ├── ops_advisor.py       # ⬅ Member D
│   └── graph.py             # LangGraph integration (optional / stretch goal)
│
├── routers/
│   ├── __init__.py
│   ├── dashboard.py         # GET /api/dashboard/{merchant_id}
│   ├── chat.py              # POST /api/chat
│   ├── merchant.py          # GET/POST /api/merchant
│   ├── recommendations.py   # GET/PATCH /api/recommendations
│   └── signals.py           # GET /api/signals + POST /api/signals/ingest
│
├── models/
│   ├── __init__.py
│   ├── merchant.py          # Merchant SQLAlchemy model
│   ├── signal.py            # WorldSignal, MerchantSignal models
│   └── recommendation.py    # Recommendation model
│
├── schemas/
│   ├── __init__.py
│   ├── merchant.py          # Pydantic request/response schemas
│   ├── signal.py            # Signal schemas
│   ├── conversation.py      # Chat message schemas
│   └── recommendation.py    # Recommendation schemas
│
├── utils/
│   ├── __init__.py
│   ├── glm_client.py        # call_glm(), call_glm_json() — Z.AI OpenAI-compatible wrapper
│   └── prompt_builder.py    # build_merchant_context(), build_signal_context()
│
├── signals/
│   └── ingest.py            # Signal ingestion pipeline (parse raw → WorldSignal → route)
│
├── tasks/
│   └── background.py        # Celery periodic tasks (poll signals, process queue)
│
└── alembic/
    ├── env.py
    ├── script.py.mako
    └── versions/
        └── 0001_initial_schema.py
```

---

---

## Member A — Inventory Planner Agent

**Files you own:**
- `agents/inventory_planner.py` ← primary ownership
- `routers/signals.py` (shared, co-own with Member D for ingestion pipeline)
- Signal seed data in `seed_demo.py` for commodity/weather signals

**Your agent's domain:**  
Commodity prices · weather events · supply chain disruptions → restock recommendations

### Agent Output Schema (JSON your `analyze()` must return)
```json
{
  "headline":            "Restock jasmine rice within 5 days.",
  "urgency":             "urgent",
  "affected_ingredient": "Jasmine rice",
  "recommended_action":  "Order 60 kg from RiceKing MY before Thursday.",
  "order_quantity":      60,
  "order_unit":          "kg",
  "order_within_days":   5,
  "cost_now":            2520.00,
  "cost_later_low":      2898.00,
  "cost_later_high":     3024.00,
  "reasoning":           "Typhoon Haikui will disrupt Thai rice supply. Prices expected to rise 15-20% over next 2 weeks. Current stock covers only 5 days.",
  "triggered_by":        "Typhoon Haikui — Thai rice supply disruption"
}
```

### Dashboard card this produces (must match frontend mock)
```json
{
  "agent":    "Inventory Planner",
  "urgency":  "red",
  "headline": "Restock jasmine rice within 5 days.",
  "detail":   "Typhoon forecast may raise prices 15-20%. Recommended order: 60kg.",
  "time":     "45 mins ago",
  "status":   "pending"
}
```

### What to implement / complete
- [ ] Refine the LLM system prompt in `SYSTEM_PROMPT_ANALYZE` so the GLM consistently returns valid JSON matching the schema above
- [ ] Improve `_consult()` to return a richer perspective (not just a placeholder string) — called by orchestrator during A2A broadcasts
- [ ] Add `query()` edge cases: "What should I restock now?", "How much jasmine rice should I order?", "Is there a supply risk this week?"
- [ ] Write 2–3 test calls (can be a `scripts/test_inventory.py`) that mock a typhoon signal and assert the output shape is correct
- [ ] Define your MCP tool in `mcp_server.py`:
  ```python
  {
    "name": "inventory_planner_analyze",
    "description": "Analyze a supply chain or commodity signal and return a restock recommendation for the merchant.",
    "parameters": { "signal": {...}, "merchant": {...} }
  }
  ```

### Key signals your agent handles
| Signal type | Example | Urgency |
|-------------|---------|---------|
| `weather`   | Typhoon Haikui, Thai rice disruption | `urgent` → `red` |
| `commodity` | Palm oil futures up 11% | `watch` → `amber` |
| `supply_chain` | Port Klang container delay +3.2 days | `watch` → `amber` |

---

## Member B — Market Analyst Agent

**Files you own:**
- `agents/market_analyst.py` ← primary ownership
- `routers/recommendations.py` (GET list, PATCH status update)
- Frontend pages this must serve: `Recommendations.tsx`, partially `MarketAnalyst.tsx`

**Your agent's domain:**  
Consumer trends · competitor pricing · demand patterns → pricing and product launch recommendations

### Agent Output Schema (JSON your `analyze()` must return)
```json
{
  "headline":              "Matcha drinks trending +38% regionally.",
  "urgency":               "watch",
  "trend_category":        "Matcha",
  "trend_growth_percent":  38,
  "local_saturation":      "low",
  "recommended_action":    "Add 2 matcha SKUs (Matcha Latte RM 12, Matcha Fruit RM 10) within 7 days.",
  "pricing_recommendation": "RM 10–12 per item",
  "estimated_margin":       62,
  "reasoning":             "Matcha search volume up 38% regionally. Only 4 of 15 local competitors carry matcha. Early mover advantage window is approximately 3 weeks.",
  "triggered_by":          "Matcha search volume +38% regional trend"
}
```

### Dashboard card this produces
```json
{
  "agent":    "Market Analyst",
  "urgency":  "amber",
  "headline": "Matcha drinks trending +38% regionally.",
  "detail":   "4 competitors near you have added matcha — 11 have not. Opportunity window open.",
  "time":     "4 hours ago",
  "status":   "pending"
}
```

### Recommendations endpoint (`GET /api/recommendations`)
The `Recommendations.tsx` page renders a full log of all past + pending alerts.  
Your endpoint must return an array of:
```json
[
  {
    "id":       "alt_3",
    "agent":    "Market Analyst",
    "urgency":  "amber",
    "headline": "Matcha drinks trending +38% regionally.",
    "detail":   "4 competitors near you have added matcha — 11 have not. Opportunity window open.",
    "time":     "4 hours ago",
    "status":   "pending",
    "note":     null
  }
]
```

`PATCH /api/recommendations/{id}` — updates `status` to `"acted_on"` or `"dismissed"`.

### What to implement / complete
- [ ] Refine `SYSTEM_PROMPT_ANALYZE` so GLM returns the full schema consistently
- [ ] Flesh out `recommendations.py` router: paginated GET list + PATCH status update
- [ ] Enrich `_consult()` with real market perspective (product names, pricing, local saturation estimate)
- [ ] Write query examples: "Should I add matcha now?", "How should I price this week?", "Am I underpriced on Brown Sugar Boba?"
- [ ] Brown Sugar Boba is underpriced by RM 1.50 vs area avg — make sure your agent flags this as `watch`/`amber`
- [ ] MCP tool definition in `mcp_server.py`:
  ```python
  {
    "name": "market_analyst_analyze",
    "description": "Analyze a consumer trend or competitor pricing signal and return a market recommendation.",
    "parameters": { "signal": {...}, "merchant": {...} }
  }
  ```

### Key signals your agent handles
| Signal type | Example | Urgency |
|-------------|---------|---------|
| `trend`     | Matcha search +38% regional | `watch` → `amber` |
| `commodity` | Palm oil up 11% → cost pressure | `urgent` → `red` |
| `competitor`| Competitor promo alerts | `watch` → `amber` |

---

## Member C — Location Scout Agent

**Files you own:**
- `agents/location_scout.py` ← primary ownership
- `routers/merchant.py` (merchant profile CRUD, onboarding)
- The `LOCAL_COMPETITORS` and `WORLD_SIGNALS` (Real Estate type) data that feeds `IntelligenceMap.tsx`

**Your agent's domain:**  
Infrastructure · foot traffic · rental indices · MRT/transit → site assessment and expansion recommendations

### Agent Output Schema (JSON your `analyze()` must return)
```json
{
  "headline":          "Block C, Section 14 opportunity.",
  "urgency":           "opportunity",
  "location_name":     "Block C, Section 14, Petaling Jaya",
  "location_score":    74,
  "key_advantages":    [
    "MRT station 800m, opening in 14 months",
    "Rental 18% below district average",
    "Low bubble tea density in 1km radius"
  ],
  "key_risks":         [
    "Construction disruption for 14 months",
    "Uncertain footfall until station opens"
  ],
  "recommended_action": "Reserve contact with landlord. Monitor rental trajectory over next 2 months.",
  "act_within":        "next 2 months",
  "reasoning":         "MRT accessibility will drive significant footfall uplift upon opening. Acting early locks in below-market rent before the area reprices.",
  "triggered_by":      "New MRT station approved — Petaling Jaya Section 14"
}
```

### Dashboard card this produces
```json
{
  "agent":    "Location Scout",
  "urgency":  "green",
  "headline": "Block C, Section 14 opportunity.",
  "detail":   "MRT station 800m away, opening in 14 months. Rental currently 18% below district average.",
  "time":     "2 days ago",
  "status":   "acted_on"
}
```

### Merchant onboarding endpoint
`POST /api/merchant/onboard` — saves merchant profile after the Onboarding flow.
```json
{
  "owner_name":       "Siti",
  "business_name":    "Siti's Bubble Tea",
  "sector":           "F&B",
  "sub_category":     "Bubble Tea",
  "location_name":    "Petaling Jaya, Selangor",
  "latitude":         3.1073,
  "longitude":        101.6067,
  "staff_count":      3,
  "monthly_revenue_estimate": 20000,
  "phase":            "running",
  "products":         [{ "name": "Classic Milk Tea", "price": 7.00 }],
  "ingredients":      [{ "name": "Jasmine rice", "stock_days": 5 }]
}
```

Response must include a `merchant_id` (UUID) that the frontend stores in localStorage.

### What to implement / complete
- [ ] Strengthen `analyze()` to use the full output schema above; currently `_consult()` is a stub
- [ ] Implement `routers/merchant.py`:
  - `POST /api/merchant/onboard` — creates merchant, returns `{ merchant_id, name, phase }`
  - `GET  /api/merchant/{merchant_id}` — returns full merchant profile
  - `PUT  /api/merchant/{merchant_id}` — updates merchant profile
- [ ] Flesh out `_consult()` to return competitor density and foot traffic insight
- [ ] Query examples: "Where should I open a second location?", "Is my current location still good?", "What's the foot traffic like near The Curve?"
- [ ] Ensure coordinates in all your responses use `lat`/`lng` format matching the frontend's Leaflet map (not `latitude`/`longitude`)
- [ ] MCP tool definition in `mcp_server.py`:
  ```python
  {
    "name": "location_scout_analyze",
    "description": "Analyze an infrastructure or real estate signal and return a location/expansion recommendation.",
    "parameters": { "signal": {...}, "merchant": {...} }
  }
  ```

### Key signals your agent handles
| Signal type        | Example | Urgency |
|--------------------|---------|---------|
| `infrastructure`   | MRT station opening | `opportunity` → `green` |
| `real_estate`      | New F&B zone, JB commercial dev | `opportunity` → `teal` |
| `foot_traffic`     | Peak detection at The Curve | `info` → `green` |

---

## Member D — Ops Advisor Agent + Orchestrator + Infrastructure

**Files you own:**
- `agents/ops_advisor.py` ← primary ownership  
- `agents/orchestrator.py` — maintain and extend
- `routers/chat.py` — the chat endpoint that calls the orchestrator
- `routers/dashboard.py` — the fast dashboard aggregation endpoint
- `routers/signals.py` — signal ingestion
- Shared infrastructure: `main.py`, `config.py`, `database.py`, `redis_client.py`, `celery_app.py`
- `seed_demo.py` — run this to populate Siti's demo data

**Your agent's domain:**  
Calendar events · public holidays · local events · labour market → staffing and resource allocation recommendations

### Ops Advisor Output Schema
```json
{
  "headline":        "Public holiday Saturday + football match 3pm.",
  "urgency":         "watch",
  "event_name":      "Labour Day + Premier League Final",
  "event_date":      "2026-05-01",
  "event_type":      "public_holiday",
  "foot_traffic_multiplier": 2.1,
  "peak_hours":      "14:00–18:00",
  "recommended_action": "Schedule 1 extra staff 2-6pm. Prep 40% more pearls and cups.",
  "estimated_revenue_uplift": 650.00,
  "reasoning":       "Historical data shows 2.1x foot traffic on public holidays with concurrent sporting events. Without extra staff, queue time exceeds 8 minutes and customers leave.",
  "triggered_by":    "Public holiday + regional football match signal"
}
```

### Dashboard card this produces
```json
{
  "agent":    "Ops Advisor",
  "urgency":  "amber",
  "headline": "Public holiday Saturday + football match 3pm.",
  "detail":   "Foot traffic 2.1x average 2-6pm. Consider scheduling extra staff.",
  "time":     "Yesterday",
  "status":   "dismissed"
}
```

### Chat endpoint (`POST /api/chat`)
This is the most complex endpoint. It must:
1. Accept `{ merchant_id, message, conversation_history }`
2. Load the merchant from DB
3. Load the 5 most recent pending recommendations
4. Load the 3 most active signals
5. Call `orchestrator.synthesise(question, merchant, history, recs, signals)`
6. Return `{ response: string, agent_outputs: [{agent, response}] }`

```json
// POST /api/chat
{
  "merchant_id":        "uuid-here",
  "message":            "What should I restock now?",
  "conversation_history": [
    { "role": "user",   "content": "..." },
    { "role": "system", "content": "..." }
  ]
}

// Response
{
  "response":      "Based on current signals, you should prioritise...",
  "agent_outputs": [
    { "agent": "inventory_planner", "response": "..." },
    { "agent": "market_analyst",    "response": "..." }
  ]
}
```

### Dashboard endpoint shape (already implemented in `routers/dashboard.py`)
Check that your response matches exactly:
```json
{
  "merchant_id":    "uuid",
  "merchant_name":  "Siti's Bubble Tea",
  "priority_alerts": [
    {
      "id":             "uuid",
      "agent":          "Inventory Planner",
      "urgency":        "urgent",
      "headline":       "Restock jasmine rice within 5 days.",
      "body":           "Typhoon forecast may raise prices 15-20%.",
      "structured_data": {},
      "status":         "pending",
      "created_at":     "2026-04-22T04:00:00Z"
    }
  ],
  "world_radar": [
    {
      "id":               "uuid",
      "signal_type":      "weather",
      "title":            "Typhoon Haikui",
      "summary":          "Agricultural disruption forecast...",
      "origin_name":      "Nakhon Si Thammarat, Thailand",
      "origin_latitude":  8.4333,
      "origin_longitude": 99.9667,
      "urgency":          "urgent",
      "relevance_score":  0.95,
      "assigned_agent":   "inventory_planner",
      "ingested_at":      "2026-04-22T03:00:00Z"
    }
  ],
  "agent_statuses": {
    "inventory_planner": { "status": "processing", "text": "Analyzing Thai rice markets..." },
    "market_analyst":    { "status": "idle",       "text": "Monitoring local trends" },
    "ops_advisor":       { "status": "idle",       "text": "Analyzing weekend foot traffic patterns" },
    "location_scout":    { "status": "idle",       "text": "Scanning commercial real estate data" }
  }
}
```

### What to implement / complete
**Ops Advisor:**
- [ ] Refine `SYSTEM_PROMPT_ANALYZE` in `ops_advisor.py` to return full schema above consistently
- [ ] Improve `_consult()` — currently stub; should return staffing and resource perspective
- [ ] Query examples: "When do I need extra staff?", "Is this weekend busy?", "Should I extend hours for the public holiday?"

**Orchestrator:**
- [ ] Verify the A2A `broadcast_consult()` in orchestrator properly merges all 4 agent perspectives
- [ ] Make sure `synthesise()` always ends with the **"Your Next 3 Actions:"** format the frontend chat expects
- [ ] Add a fallback: if all 4 agents fail, return a graceful structured error (not a 500)

**Chat Router (`routers/chat.py`):**
- [ ] Implement the full `POST /api/chat` endpoint as described above
- [ ] Save each conversation turn to the `conversations` table
- [ ] Store agent status in Redis after each invocation: `merchant:{id}:agent:{name}:status`

**Dashboard Router (`routers/dashboard.py`):**
- [ ] Map internal urgency values to frontend colour labels before returning:
  - `urgent` → `"red"`, `watch` → `"amber"`, `opportunity` → `"teal"`, `info` → `"green"`
- [ ] Map internal agent names to display names:
  - `"inventory_planner"` → `"Inventory Planner"`, etc.

**Infrastructure / Seed:**
- [ ] Run `seed_demo.py` to populate the DB with Siti's full profile, all 8 ingredients, 5 menu items, 5 world signals, and 5 recommendations
- [ ] Confirm `docker-compose.yml` starts PostgreSQL + Redis cleanly for all team members
- [ ] Set `.env` variables: `ZAI_API_KEY`, `ZAI_BASE_URL`, `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`

---

## Shared Responsibilities (Everyone)

| Task | Who |
|------|-----|
| Run `docker-compose up` to start Postgres + Redis | All (one person set it up, others pull) |
| Run `alembic upgrade head` once DB is running | Member D (infra) |
| Run `seed_demo.py` to pre-populate Siti's data | Member D |
| Set `.env` from `.env.example` | All |
| Confirm your agent's `analyze()` output passes a JSON-shape assertion | Each member |
| Add your MCP tool definition to `mcp_server.py` | Each member |

---

## Integration Checklist (demo-ready)

- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] `GET /api/dashboard/{siti_merchant_id}` returns 3+ pending alerts matching card shapes
- [ ] `POST /api/chat` with "What should I restock now?" returns a synthesised response with **Next 3 Actions**
- [ ] `GET /api/signals` returns 5 world signals with correct `type`, `coords`, `urgency`, `agentProcessing`
- [ ] `GET /api/recommendations` returns full log with `acted_on`, `dismissed`, `pending` statuses
- [ ] `agents/inventory_planner.py` `analyze()` returns valid schema for a typhoon signal
- [ ] `agents/market_analyst.py` `analyze()` returns valid schema for a matcha trend signal
- [ ] `agents/location_scout.py` `analyze()` returns valid schema for an MRT station signal
- [ ] `agents/ops_advisor.py` `analyze()` returns valid schema for a public holiday signal
- [ ] Orchestrator `synthesise()` correctly calls all 4 agents and merges outputs
- [ ] All 4 MCP tool placeholders defined in `mcp_server.py`

---

## Urgency Mapping Reference

| Backend (agent output) | Frontend card colour | Frontend label |
|------------------------|---------------------|----------------|
| `urgent`               | `red`               | Critical / red dot |
| `watch`                | `amber`             | Medium / amber dot |
| `opportunity`          | `teal`              | Positive / teal dot |
| `info`                 | `green`             | Low / green dot |

## Agent Name Mapping Reference

| Backend key          | Frontend display name |
|----------------------|-----------------------|
| `inventory_planner`  | `Inventory Planner`   |
| `market_analyst`     | `Market Analyst`      |
| `location_scout`     | `Location Scout`      |
| `ops_advisor`        | `Ops Advisor`         |

---

## Startup Commands (everyone runs these)

```bash
# 1. Start DB + Redis
docker-compose up -d

# 2. Install deps (use venv)
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 3. Migrate DB
alembic upgrade head

# 4. Seed demo data (Siti's full profile)
python seed_demo.py

# 5. Start FastAPI
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

*Last updated: 2026-04-22 by Antigravity*
