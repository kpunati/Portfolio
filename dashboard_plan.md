# Future Dashboard Plan

Reference plan for three creative data dashboard ideas that should not be built into the
portfolio all at once. The near-term portfolio candidate is the Labor Market Skills
Heatmap. The Public Trust Signal Dashboard and Supply Chain Fragility Monitor are
strong standalone future projects.

Do not implement these dashboards into the app until explicitly requested.

## Direction

The current portfolio already has a cinematic Earth Intelligence globe. Future dashboards
should avoid repeating the same geospatial/live-map pattern. The stronger direction is to
show Karthik can turn public, messy, real-world data into useful signals that a normal
person can understand.

Good dashboard subjects should pass this test:

- A non-technical person can understand the concept in one sentence.
- The data has real-world stakes.
- The UI is more than a table or news feed.
- The project shows data cleaning, ranking, grouping, and interpretation.
- The MVP can run with public APIs and graceful fallback data.

Recommended build order:

1. Labor Market Skills Heatmap
2. Public Trust Signal Dashboard
3. Supply Chain Fragility Monitor

## 1. Labor Market Skills Heatmap

### Plain-English Pitch

"It shows what skills employers are starting to ask for, and which skills are beginning
to appear together."

This is not a job board. It is a signal dashboard that turns job postings into a view of
where the labor market is moving.

### Why It Is Interesting

Most job tools show open roles. This dashboard shows skill momentum. A visitor should be
able to quickly understand:

- Which skills are hot right now.
- Which skills are starting to cluster together.
- Which role families are absorbing AI/data/automation skills.
- Whether a skill is broad market demand or niche-specialist demand.
- Where Karthik's own skill set sits inside the market.

This is portfolio-relevant because it connects directly to data analysis, AI, automation,
and career-market intelligence.

### MVP Scope

Build a compact dashboard that answers:

- What are the top demanded technical skills?
- Which skills most often appear together?
- Which skills are rising inside data/AI/automation roles?
- Which role families are driving the signal?
- How fresh is the source data?

Recommended MVP panels:

- Skill Demand Strip: top 5 skills by posting frequency.
- Skills Heatmap: matrix of skill co-occurrence pairs.
- Role Cluster Cards: Data Analyst, AI Engineer, Automation Analyst, Cyber Analyst,
  BI Developer, Data Engineer.
- Rising Signals: skills with notable short-window growth or strong recent appearance.
- Source Health: last fetched time, posting count, fallback/live status.

### Candidate Data Sources

Primary source:

- USAJOBS API: https://developer.usajobs.gov/api-reference/
  - Useful for public federal job postings.
  - Search API requires a USAJOBS API key.
  - Good fields for title, organization, location, remote status, description, and dates.

Macro context:

- BLS Public Data API: https://www.bls.gov/developers/
  - Useful for employment/unemployment and broader labor context.
  - Better as a companion signal, not the core posting source.

Possible future sources:

- Greenhouse or Lever public boards for selected companies.
- Adzuna or other job APIs if an API key is acceptable.
- Static curated snapshots if fully public live data is too noisy.

### Data Model

Minimum normalized item:

```js
{
  id: "source-specific-id",
  source: "usajobs",
  title: "Data Analyst",
  organization: "Agency or company",
  location: "Remote / Washington, DC / ...",
  isRemote: true,
  postedAt: "2026-05-13",
  roleFamily: "Data Analyst",
  description: "Full posting text or excerpt",
  detectedSkills: ["Python", "SQL", "Power BI"],
  seniority: "entry|mid|senior|unknown"
}
```

Minimum aggregate response:

```js
{
  generatedAt: "ISO timestamp",
  status: "live|cached|fallback",
  sourceStatus: [
    { id: "usajobs", status: "live", itemCount: 120 }
  ],
  summary: {
    postingCount: 120,
    topSkill: "SQL",
    topRoleFamily: "Data Analyst",
    remoteShare: 0.42
  },
  skills: [
    { skill: "SQL", count: 72, share: 0.6, roleFamilies: ["Data Analyst"] }
  ],
  cooccurrence: [
    { source: "Python", target: "SQL", count: 41, lift: 1.4 }
  ],
  roleFamilies: [
    { name: "Data Analyst", count: 44, topSkills: ["SQL", "Power BI", "Python"] }
  ],
  postings: []
}
```

### Skill Extraction Approach

Start with a curated dictionary, not an LLM dependency. It will be faster, cheaper, and
more predictable for a portfolio dashboard.

Initial skill dictionary:

- Data: SQL, Python, R, Excel, Power BI, Tableau, Looker, Snowflake, BigQuery, dbt,
  Airflow, Spark, Pandas
- AI/ML: Machine Learning, NLP, LLM, RAG, OpenAI, LangChain, scikit-learn, TensorFlow,
  PyTorch, Prompt Engineering
- Cloud/Engineering: AWS, Azure, GCP, Docker, Kubernetes, APIs, FastAPI, Node, React,
  TypeScript
- Analytics/Business: Forecasting, A/B Testing, KPI, Dashboarding, ETL, Data Modeling,
  Financial Analysis
- Security/Automation: SIEM, Splunk, Vulnerability Management, Automation, Power
  Automate, Zapier

Normalize obvious aliases:

- "Gen AI", "Generative AI" -> "Generative AI"
- "PowerBI", "Power BI" -> "Power BI"
- "PostgreSQL", "Postgres" -> "PostgreSQL"
- "Large Language Models", "LLMs" -> "LLM"

### Scoring Ideas

For MVP, keep scoring explainable:

- Demand count: number of postings containing a skill.
- Share: skill count divided by total postings.
- Pair strength: number of postings where two skills appear together.
- Lift: pair frequency compared with what would be expected from each skill alone.
- Freshness: percentage of postings from the last 7 or 14 days.

Avoid claiming true market-wide conclusions unless the data source coverage supports it.
Use language like "sampled postings" or "public posting signal."

### UI Direction

Name options:

- Skill Market Heatmap
- Labor Signal Matrix
- Skills Demand Radar
- Hiring Signal Heatmap

Recommended name for portfolio:

**Labor Market Skills Heatmap**

Recommended subtitle:

"Live public job postings translated into skill demand, role clusters, and emerging
skill pairings."

Visual design:

- Keep it in the existing `embed-shell` style below the globe.
- Avoid a second heavy 3D scene.
- Use dense, editorial UI: heatmap, ranked cards, source chips, compact metrics.
- Accent colors should stay close to the portfolio: gold, teal, plum, warm charcoal.

Potential layout:

- Header: "Labor Market Skills Heatmap" plus source chips.
- Top stat row: postings sampled, skills detected, top cluster, remote share.
- Main left: heatmap matrix of skill pairings.
- Main right: role cluster cards with top skills.
- Bottom: recent posting signal feed, grouped by role family.

### Portfolio Implementation Notes

When this is implemented in the portfolio:

- Add a new serverless endpoint such as `/api/labor-skills.js`.
- Add a new lightweight frontend module such as `src/sections/labor-skills.js`.
- Add markup below the globe inside the existing dashboards grid.
- Keep data loading independent from the globe.
- Do not add a permanent animation loop.
- Use static fallback data if USAJOBS credentials are missing or rate-limited.
- Keep it readable on mobile by collapsing the heatmap into ranked pair rows.

Acceptance criteria:

- A non-technical visitor understands the dashboard in under 10 seconds.
- The dashboard shows meaningful results even in fallback mode.
- The page remains smooth below the globe.
- `npm run build` passes.
- No horizontal overflow on mobile.

### Future Expansion

- Compare skill demand across cities or remote vs onsite.
- Add historical snapshots to show week-over-week movement.
- Add a "Karthik fit" overlay showing where portfolio skills match market clusters.
- Add role transition paths, for example "Data Analyst -> AI Analyst."
- Add automated weekly snapshots to build a real trend history.

## 2. Public Trust Signal Dashboard

### Plain-English Pitch

"It shows where public confidence might be under pressure by tracking recalls, safety
notices, and enforcement signals."

This dashboard turns scattered public safety and enforcement notices into a trust-pressure
view by industry, product type, hazard, or company.

### Why It Is Interesting

Public trust is hard to see in one place. Recalls, enforcement notices, safety warnings,
and product issues often live across different government sites. This dashboard would
translate that noise into a readable signal:

- Which product categories are seeing safety pressure?
- Which hazards are most common right now?
- Which sectors have rising recall or enforcement activity?
- Are consumers being offered refunds, repairs, replacements, or no remedy?
- Which signals are new vs persistent?

It is a creative use of data because it reframes dry regulatory notices into a public
confidence dashboard.

### MVP Scope

Start with recalls and enforcement reports.

Recommended MVP panels:

- Trust Pressure Score: composite score by product category.
- Top Hazards: fire, burn, choking, poisoning, crash, contamination, device failure.
- Recent Incidents Feed: newest recall/enforcement items with source and severity.
- Remedy Mix: refund, repair, replace, dispose, no remedy.
- Category Trend Strip: categories with more recent notices than baseline.

### Candidate Data Sources

Consumer products:

- CPSC Recalls API:
  https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information

Medical devices:

- openFDA Device Enforcement:
  https://open.fda.gov/apis/device/enforcement/

Drugs:

- openFDA Drug Enforcement:
  https://open.fda.gov/apis/drug/enforcement/

Future additions:

- NHTSA recalls for vehicles.
- SEC filings or press releases for company disclosure context.
- News mentions only as secondary context, not the core source.

### Data Model

Minimum normalized item:

```js
{
  id: "source-specific-id",
  source: "cpsc|openfda-device|openfda-drug",
  title: "Recall title",
  company: "Company name",
  category: "Product category",
  hazard: "Fire",
  severity: "low|medium|high|unknown",
  remedy: "refund|repair|replace|dispose|unknown",
  date: "2026-05-13",
  description: "Short summary",
  url: "source URL"
}
```

Minimum aggregate response:

```js
{
  generatedAt: "ISO timestamp",
  status: "live|cached|fallback",
  summary: {
    itemCount: 80,
    topHazard: "Fire",
    topCategory: "Consumer electronics",
    highPressureCategories: 4
  },
  categories: [],
  hazards: [],
  remedies: [],
  items: []
}
```

### Scoring Ideas

Trust pressure can be a transparent score, not a black box:

- Recency weight: newer notices count more.
- Severity weight: injury/death/fire/contamination language counts more.
- Frequency weight: repeated category/company mentions count more.
- Remedy weight: "no remedy" or "dispose" may increase pressure.
- Source weight: official recall/enforcement source only.

Avoid legal or investment-like claims. Use careful language:

- "public safety signal"
- "trust pressure"
- "recall/enforcement activity"
- "not a determination of company safety"

### UI Direction

Name options:

- Public Trust Signal Dashboard
- Trust Pressure Monitor
- Recall Risk Radar
- Confidence Signal Console

Recommended name:

**Public Trust Signal Dashboard**

Recommended subtitle:

"Official recalls and enforcement notices translated into category-level trust pressure."

Visual design:

- Use an editorial risk console style.
- Main visual could be a barometer or category pressure lanes.
- Avoid fear-heavy red UI everywhere; use restrained severity accents.
- Pair incident cards with simple "why it matters" labels.

Potential layout:

- Header: trust pressure, official source chips, last update.
- Left: category pressure bars.
- Center: hazard distribution and remedy mix.
- Right: recent notice feed.
- Bottom: source health and methodology note.

### Future Expansion

- Entity matching for company-level dashboards.
- Historical trend snapshots.
- Sector pages for consumer electronics, food/drug, medical devices, vehicles.
- Plain-English weekly digest: "What changed this week?"
- Optional LLM summarization if source text is long, with source links preserved.

## 3. Supply Chain Fragility Monitor

### Plain-English Pitch

"It shows which everyday products may become harder, slower, or more expensive to move."

This dashboard tracks pressure across the hidden systems behind a product: raw materials,
shipping, ports, energy, and demand.

### Why It Is Interesting

Supply chains are abstract until something breaks. A creative dashboard can make hidden
dependencies visible by focusing on one vertical and showing the pipeline as a living
system.

Strong vertical options:

- AI hardware / GPUs
- Coffee
- EV batteries
- Medicine
- Semiconductors
- Construction materials

Recommended first vertical:

**AI hardware / GPUs** if the goal is portfolio alignment with AI/data.

Alternative:

**Coffee** if the goal is a more human, memorable non-technical story.

### MVP Scope

Choose one vertical and build a fragility score from proxy signals.

Recommended MVP panels:

- Fragility Score: current composite pressure level.
- Pressure Drivers: shipping, energy, commodity, demand, disruption notes.
- Pipeline Diagram: raw input -> manufacturing -> shipping -> demand.
- Recent Changes: what moved most since the last snapshot.
- Source Health: which sources are live, cached, or fallback.

### Candidate Data Sources

Port and freight:

- BTS Port Performance Freight Statistics:
  https://www.bts.gov/ports

Economic and market series:

- FRED API:
  https://fred.stlouisfed.org/docs/api/fred

Energy:

- EIA Open Data API:
  https://www.eia.gov/opendata/documentation.php

Agriculture and food verticals:

- USDA Market News:
  https://www.ams.usda.gov/market-news

Future additions:

- Census trade data.
- Commodity APIs if acceptable.
- News/event context as supporting evidence only.

### Data Model

Minimum normalized signal:

```js
{
  id: "diesel-price",
  label: "Diesel Price",
  category: "energy",
  value: 4.12,
  unit: "USD/gal",
  date: "2026-05-13",
  baselineValue: 3.65,
  direction: "up",
  pressure: 0.68,
  source: "eia"
}
```

Minimum aggregate response:

```js
{
  generatedAt: "ISO timestamp",
  status: "live|cached|fallback",
  vertical: "AI hardware",
  summary: {
    fragilityScore: 67,
    topDriver: "shipping",
    changedMost: "diesel-price"
  },
  drivers: [
    { category: "shipping", pressure: 0.72, label: "Elevated" }
  ],
  signals: [],
  events: []
}
```

### Scoring Ideas

Fragility score should be simple and explainable:

- Normalize each signal against its baseline.
- Convert each signal into 0 to 1 pressure.
- Weight drivers by relevance to the selected vertical.
- Aggregate into a 0 to 100 score.
- Show top contributors so the score is not mysterious.

Example driver weights for AI hardware:

- Shipping/port congestion: 30%
- Energy costs: 20%
- Semiconductor-related demand proxy: 25%
- Trade/import signal: 15%
- Disruption/event context: 10%

Example driver weights for coffee:

- Commodity price: 35%
- Shipping/freight: 25%
- Weather/event context: 20%
- Energy costs: 10%
- Retail/grocery pressure: 10%

### UI Direction

Name options:

- Supply Chain Fragility Monitor
- Product Pressure Map
- Hidden Pipeline Monitor
- Fragility Index
- Everyday Supply Signals

Recommended name:

**Supply Chain Fragility Monitor**

Recommended subtitle:

"A product-level view of the hidden pressures behind price, availability, and delivery."

Visual design:

- Use a pipeline visual rather than a map.
- Each stage gets a pressure meter.
- Center the UI on the selected vertical.
- Make "what changed" obvious.

Potential layout:

- Header: selected product/vertical, fragility score, source freshness.
- Main: horizontal pipeline with pressure at each stage.
- Side: top drivers and recent changes.
- Bottom: signal table with source labels and baselines.

### Future Expansion

- Add multiple verticals.
- Add "compare products" mode.
- Add historical snapshots.
- Add event annotations.
- Add scenario mode: "what if shipping rises 15%?"

## Shared Architecture For Future Builds

These dashboards should use the same implementation pattern when added to this portfolio
or split into standalone apps.

### Data Flow

```text
Public APIs
  -> serverless endpoint
  -> normalize and score
  -> cache or fallback
  -> small frontend JSON payload
  -> dashboard shell
```

### Endpoint Expectations

Each endpoint should return:

- `generatedAt`
- `status`: `live`, `cached`, or `fallback`
- `sourceStatus`
- `summary`
- dashboard-specific arrays for charts/cards
- compact `items` for feeds

Each endpoint should handle:

- missing API keys
- upstream failure
- rate limits
- empty result sets
- malformed records

### Frontend Expectations

Frontend dashboards should:

- Render a useful fallback state.
- Show source freshness.
- Avoid permanent animation loops.
- Avoid heavy new dependencies for v1.
- Use existing portfolio visual language.
- Collapse cleanly on mobile.

### Portfolio Fit

Only one new dashboard should be added to the current portfolio for now:

- Add Labor Market Skills Heatmap below the globe.
- Keep Public Trust and Supply Chain as future standalone projects.
- Keep the dashboards section focused: Earth telemetry plus one analytical dashboard.

## Notes For Future Implementation

When ready to build the Labor Market Skills Heatmap:

1. Confirm whether a USAJOBS API key is available.
2. If not, build with curated fallback data first.
3. Add the endpoint and frontend module without touching the globe internals.
4. Keep the dashboard lightweight and static-rendered after fetch.
5. Verify with `npm run build` and browser checks at desktop/mobile widths.

