# Keyword Dashboard Builder

## What This Skill Does

Build a shareable keyword ranking dashboard from SpySERP data. The result is a live-updating React website deployed on Vercel that anyone with the link can view.

**Data flow:**
```
SpySERP API → Google Apps Script (auto weekly) → Google Sheets → React Dashboard → Vercel
```

## How to Use This Skill

Give Claude this file as context, then prompt:
> "Build a keyword ranking dashboard for [domain]. SpySERP project ID: [X], domain ID: [X], API token: [X]. Google Sheet: [link]."

Claude will follow the 4 phases below. You can also run individual phases if you only need part of the pipeline.

---

## Phase 1: Google Sheets (Database Layer)

### What to build
3 tabs in one Google Sheet:

| Tab | Role | Who updates it |
|---|---|---|
| **SpySERP Data** | Raw ranking data from API | Apps Script (automatic) |
| **Volume data** | Keyword → search volume mapping | Human (manual) |
| **Dashboard Data** | Combined view for the dashboard | Formulas (automatic) |

### Why 3 tabs instead of 1?
- **SpySERP Data** gets wiped and rewritten every sync. If volume data lived here, it would be deleted every week.
- **Volume data** is separate because SpySERP's API stores ranking and volume in different endpoints that don't match 1:1 (~100 keyword mismatches due to deleted/renamed keywords). Manual entry is more reliable.
- **Dashboard Data** merges both with formulas so the dashboard has one clean data source.

### Setup instructions

**Dashboard Data tab:**
- Cell B1: `=ARRAYFORMULA('SpySERP Data'!1:1600)` — mirrors all ranking data
- Cell A1: header "Volume"
- Cell A2: `=ARRAYFORMULA(IFERROR(VLOOKUP(B2:B, 'Volume data'!A:B, 2, FALSE), 0))`

**Why IFERROR(..., 0)?** New keywords that aren't in the Volume tab yet would return #N/A, which breaks chart calculations. Defaulting to 0 keeps everything working — the keyword just shows "volume: 0" until you update it.

**Volume data tab:**
- Column A: Keyword (exact match with SpySERP)
- Column B: Monthly search volume
- Update manually when adding new keywords to SpySERP

---

## Phase 2: Google Apps Script (Auto Sync)

### What it does
Runs weekly (Monday 9AM), pulls ranking data from SpySERP API, writes to the "SpySERP Data" tab.

### Why Apps Script?
- Free scheduled execution (no server/cron needed)
- Lives inside Google Sheets (no external infrastructure)
- Can be triggered manually via custom menu

### How it works (3-step API flow)

SpySERP doesn't have a "give me all data" endpoint. You must:

1. **Request export** (`statisticExport`) — tells SpySERP to generate a CSV file. Returns a `fileId`.
2. **Wait for export** (`statisticExportItem`) — poll every 3s until `progress: 100`. SpySERP needs time to compile data.
3. **Download & write** (`statisticExportDownload`) — download the CSV, parse it, write to sheet.

### SpySERP API quirks (important)
- **POST only** — every endpoint is POST, not GET
- **Token in 2 places** — must be in both the URL query param AND the JSON body
- **Semicolon CSV** — SpySERP exports use `;` as delimiter, not `,`. Need a custom parser.
- **Ranking ≠ Volume** — `statisticExport` has rankings but no volume. `projectKeywords` has volume but doesn't match 1:1 with export data. This is WHY volume is managed manually in Phase 1.

### Config template
```javascript
const CONFIG = {
  API_TOKEN: '<your-token>',
  PROJECT_ID: 000000,
  DOMAIN_ID: 000000000,
  SE_ID: 13038,              // 13038 = Google US
  SHEET_NAME: 'SpySERP Data',
  ALLOWED_DOMAINS: ['domain1.com', 'domain2.com'],
};
```

### Features to include
- `syncSpySERP()` — main function, runs the 3-step flow
- `setupWeeklyTrigger()` — creates Monday 9AM trigger
- `onOpen()` — adds "SpySERP Sync" menu to Sheets UI
- Domain filtering — case-insensitive, only write rows for `ALLOWED_DOMAINS`
- Semicolon CSV parser — handles quoted fields and escaped quotes

---

## Phase 3: React Dashboard

### Tech stack
```bash
npm create vite@latest keyword-dashboard -- --template react
cd keyword-dashboard
npm install recharts papaparse
npm install -D tailwindcss @tailwindcss/vite
```

**Why these choices:**
- **Vite** — fastest React scaffolding, Vercel-compatible out of the box
- **Recharts** — React-native charting, handles scatter/line/bar well
- **PapaParse** — robust CSV parser, handles Google Sheets CSV edge cases
- **Tailwind** — fast dark-theme styling without writing CSS files

### Data fetching approach

The dashboard fetches CSV directly from Google Sheets on every page load:
```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&gid=<GID>
```

**Why CSV from Sheets instead of calling SpySERP API directly?**
- No API key exposed in frontend code
- Google Sheets acts as a cache — no rate limiting
- Data is pre-merged (rankings + volume) and pre-filtered (only relevant domains)
- Anyone can check/edit the raw data without touching code

**Why no backend/caching?**
For <2000 keywords and a few team members, the CSV fetch is fast enough. Adding a backend would add complexity without meaningful benefit at this scale.

### Components to build

| Component | What it shows | Why it's useful |
|---|---|---|
| **KPICards** | Top 3, Top 10, Top 30 counts, avg position, total volume | Quick health check at a glance |
| **RankingChart** | Average position over time (line chart) | Shows trend — are rankings improving or declining? |
| **DistributionChart** | Position buckets: 1-3, 4-10, 11-20, 21-50, 51-100, >100 | Shows WHERE keywords are concentrated |
| **VolumeScatter** | Volume (Y) vs Position (X) scatter plot | Identifies high-value opportunities (high volume + bad rank) |
| **BiggestMovers** | Top gainers and losers tables | Highlights what changed since last check |
| **KeywordTable** | Full searchable, sortable, paginated table | Detailed drill-down for any keyword |

### App layout

- **Sticky header** with domain dropdown + category filter pills — stays visible while scrolling
- **Domain filter** — dropdown, defaults to primary domain. No "All Domains" because mixing competitor data with own data in charts is misleading
- **Category filter** — pill buttons with keyword count badges. "All" + each category from data
- **Filter chain:** raw data → filter by domain → filter by category → pass to all components

### Recharts gotchas (save debugging time)

| Problem | Wrong approach | Correct approach | Why |
|---|---|---|---|
| Scatter X-axis should go 101→1 | `domain={[101, 1]}` + `reversed` | `domain={[101, 1]}` only | Both together double-reverse back to ascending |
| Axis ticks shift when filtering categories | Default Recharts behavior | Add `allowDataOverflow` to XAxis | Forces consistent tick marks regardless of data range |
| Volume Y-axis needs log scale | Linear scale | `scale="log"` + `domain={[1, 'auto']}` | Volume ranges from 10 to 100k — linear makes small values invisible |

---

## Phase 4: Deploy to Vercel

```bash
npm i -g vercel    # Install CLI
vercel login       # Auth via browser
cd keyword-dashboard
npm run build      # Generate dist/
vercel --prod      # Deploy from project root (not from dist/)
```

**Why Vercel?** Free tier, auto-detects Vite, gives instant public URL. No config needed.

Result: `https://your-project.vercel.app`

To update after code changes: `npm run build && vercel --prod`

---

## Customization Checklist

When building for a new project, change these:

- [ ] Google Sheet ID and GID in `fetchSheetData.js`
- [ ] `CONFIG` values in Apps Script (token, project ID, domain ID, SE ID)
- [ ] `ALLOWED_DOMAINS` in Apps Script
- [ ] Default domain in `useState('your-domain.com')` in App.jsx
- [ ] Dashboard title in header
- [ ] Populate Volume data tab with keyword volumes

---

## Known Limitations & When to Upgrade

| Limitation | Impact | When it matters |
|---|---|---|
| Google Sheets max ~10M cells | Data grows ~250 rows/domain/week | After 2-3 years with 6+ domains |
| No caching (CSV fetch every load) | Page load 2-5s | When >10 people use dashboard simultaneously |
| Volume is manual | New keywords show volume=0 | When adding keywords frequently |
| No error alerts | Silent failures in Apps Script | When data freshness is critical |
| Sheets down = dashboard blank | Single point of failure | When dashboard is business-critical |

**Upgrade path:** If any of these become real problems, migrate to Supabase (free tier PostgreSQL) + API route. Same React frontend, just swap `fetchSheetData.js`.

---

## Reference Implementation

Working example built with this skill:
- **Dashboard code:** `d:/Claude folder/marketing-hub/keyword-dashboard/src/`
- **Apps Scripts:** `d:/Claude folder/marketing-hub/integrations/`
  - `google-apps-script-selected-domains.js` — multi-domain sync (recommended)
  - `google-apps-script.js` — single domain only
