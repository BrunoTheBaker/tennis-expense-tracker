# SBTC Treasury Dashboard — Rebuild Design Spec

**Date:** 2026-03-31
**Status:** Approved
**Build approach:** Big Bang — new shell first, then fill tabs one by one

---

## 1. Overview

Rebuild the existing Next.js/TypeScript/Tailwind treasurer app from a sidebar-based layout into a clean, high-contrast top-nav app matching the `index.html` static mockup. Target user: older club treasurer on desktop. Prioritise readability and simplicity.

No framework changes. No new dependencies beyond what's already installed (Recharts, Headless UI, Lucide, date-fns).

---

## 2. Visual Style Contract

Source of truth: `index.html` in repo root.

| Token | Value |
|---|---|
| Primary font | DM Sans (400, 500, 600, 700) |
| Monospace font | DM Mono (400, 500) — all dollar amounts |
| Brand green | `#1D9E75` |
| Nav background | `#1e3a5f` (dark navy) |
| Page background | `#f2f5f8` |
| Card surface | `#ffffff` |
| Border | `#dde3ea`, 1.5px |
| Card border-radius | 14px |
| Card padding | 22px |
| KPI value font size | 34px, DM Mono |
| Section labels | 11px uppercase, letter-spacing 0.09em |

Apply via CSS custom properties in `globals.css`. Tailwind utility classes for layout/spacing; CSS variables for brand tokens.

---

## 3. Navigation

Replace `Sidebar.tsx` + `Header.tsx` with a single `TopNav` component.

**TopNav layout:**
- Background: `#1e3a5f`
- Left: SBTC logo/wordmark (white text)
- Centre: 3 tab links — **Dashboard** | **Allocation** | **Settings**
- Active tab: underline or pill highlight in `#1D9E75`
- Right: Settings gear icon (links to `/settings`)

**Routes:**
| Path | Page |
|---|---|
| `/` | Dashboard |
| `/transactions` | Allocation (existing route kept) |
| `/settings` | Settings |
| `/reports` | Reports (linked from Dashboard, not in TopNav) |

`layout.tsx` renders `<TopNav />` above `{children}`. No sidebar. No header.

---

## 4. Dashboard (`/`)

### Period Selector
Dropdown at top of page. Options:
- "Full Year 2025-26" (default — uses latest available YTD snapshot)
- One entry per available month: "March 2025", "April 2025" … up to current month

All content below adapts to the selected period. Data comes from `FinancialPeriod` constants in `financialData.ts` (keyed by month). Months with no data show a "No data yet" state.

### KPI Cards Row
Four cards in a row (matching `index.html` metric card style):
- **Total Income** — `getTotalIncome(period)`
- **Total Expenses** — `getTotalExpenses(period)`
- **Net Position** — `getNetPosition(period)` (green if positive, red if negative)
- **COGS (Drinks)** — `getTotalCOGS(period)`

### Bank Account Balances
Six accounts, from the selected period's `balanceSheet`:
- Trading Account
- Cards Petty Cash Account
- Asset Renewal Account
- Asset Renewal Term Deposit
- Building Fund
- Building Fundraiser Term Deposit

Grouped into "Operating" (Trading, Petty Cash) and "Savings & Investments" (the other four).

### Charts (Recharts)
All charts respond to selected period:
1. **Income by Category** — horizontal bar chart, top income categories
2. **Expense by Category** — horizontal bar chart, top expense categories
3. **Income Breakdown** — donut chart
4. **Expense Breakdown** — donut chart
5. **Monthly Trend** — line chart of net position per month (only visible when "Full Year" is selected; requires multiple months of data)

### Quick Actions
Two buttons: "Go to Allocation →" and "View Reports →"

### AI Chat Panel (placeholder)
Card at page bottom. Static UI only — text input + pre-filled prompt chips ("What was our biggest expense this month?", "How do drink sales compare to last month?"). No API wiring in this build.

---

## 5. Allocation Tab (`/transactions`)

### Upload Section
Drag-and-drop zone (or file picker). Accepts:
- **Reckon** — Transactions by Account CSV (existing `parseReckonCsv`)
- **Square POS** — item-level CSV export
- **Stripe** — payout CSV export

After upload: show filename, row count, detected source type. Parse using `csvParser.ts` (extend for Square/Stripe formats).

### Transaction Review Table
Columns: Date | Description | Amount | Source | Proposed Account | Confidence | Status

Behaviour:
- Each row fetches AI suggestion from `/api/categorise` via `categoriser.ts` (Claude Haiku)
- `merchantCache.ts` skips API call for known merchants (returns `confidence: 'high'`)
- Confidence displayed as coloured pill (green/amber/red)
- Per-row actions: Accept (✓) | Override (dropdown of account codes) | Skip
- **Bulk action:** "Accept All AI Proposals" button

### Reconciliation Gate
- "Reconcile & Push" button — disabled until every row is Accepted, Overridden, or Skipped
- On click: confirmation modal showing:
  - Count: "X transactions to push"
  - Breakdown by account code + dollar total
  - Warning: "This will create entries in Reckon. Skipped rows are excluded. Continue?"
  - Confirm / Cancel
- On confirm: export CSV via `serialiseToReckonCsv` (existing). Success/failure toast.

---

## 6. Settings (`/settings`)

Four sections, all saved to localStorage:

| Section | Fields | State |
|---|---|---|
| Reckon One | API key, Book ID, Test Connection button | Active |
| Square POS | API key, Location ID | Disabled — "Use CSV upload for now" |
| Stripe | API key | Disabled — "Use CSV upload for now" |
| Bank Account Mappings | Table: 4 accounts → Reckon account codes | Active |

Reuse/simplify `ReckonIntegration.tsx`. Delete unused settings from `Settings.tsx`.

---

## 7. Reports (`/reports`)

Keep existing `PLReport`, `BalanceSheetReport`, `DrinksReport` components. Restyle to match new visual tokens (cards, borders, fonts). Same `TopNav` on this page. Accessible via Dashboard quick action button.

---

## 8. Data Layer

### Current
`src/lib/financialData.ts` exports named `FinancialPeriod` constants:
- `DEC_2025` — 1 Mar 2025 to 31 Dec 2025 (added 2026-03-31)
- `JAN_2026` — 1 Mar 2025 to 31 Jan 2026 (existing)

### Period selector mapping
```ts
export const PERIODS: Record<string, FinancialPeriod> = {
  'dec-2025': DEC_2025,
  'jan-2026': JAN_2026,
}
```
Dashboard reads available keys to populate the dropdown. Months with no key show "No data".

### Future
When Reckon API is available, replace constants with API calls. The `FinancialPeriod` type and helper functions (`getTotalIncome` etc.) stay unchanged.

### Validation
PDF reports in `FY 2025-26/Monthly/{month}/Reports/` are the source of truth for validation. Cross-check data constants against these when adding a new month.

---

## 9. Deletions

| Path | Reason |
|---|---|
| `src/app/expenses/` | Manual expense entry — not the workflow |
| `src/app/members/` | Not needed for solo treasurer |
| `src/app/budget/` | Out of scope |
| `src/components/expenses/` | ExpenseForm, ExpenseList |
| `src/components/members/` | UserManagement |
| `src/components/budget/` | BudgetTracker |
| `src/components/layout/Sidebar.tsx` | Replaced by TopNav |
| `src/components/layout/Header.tsx` | Replaced by TopNav |
| `src/components/dashboard/RecentExpenses.tsx` | Not in new design |
| `src/components/dashboard/BudgetOverview.tsx` | Not in new design |

---

## 10. Build Order

1. **Delete** — all files in §9 above
2. **TopNav + layout.tsx** — new shell, apply CSS variables to `globals.css`
3. **Dashboard** — period selector, KPI cards, bank balances, charts, quick actions, AI placeholder
4. **Allocation tab** — CSV upload (all 3 sources), AI review table, reconciliation gate + modal
5. **Settings** — 4 sections, localStorage persistence
6. **Reports** — restyle existing components to new tokens
7. **Build check** — `npm run build`, fix all errors

---

## 11. Out of Scope (This Build)

- Reckon API write integration
- Square API / Stripe API
- Database / server-side persistence
- Keyboard shortcuts in review table
- AI chat panel wiring
- Multi-user / auth
