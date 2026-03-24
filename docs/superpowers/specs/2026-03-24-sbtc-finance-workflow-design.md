# SBTC Finance Workflow — Design Spec
**Date:** 2026-03-24
**Status:** Approved (rev 2)
**Project:** Safety Bay Tennis Club — tennis-expense-tracker
**Repo:** https://github.com/BrunoTheBaker/tennis-expense-tracker
**Live:** https://tennis.automateyourbiz.app

---

## Problem Statement

The SBTC treasurer manually steps through every transaction in Reckon each month to assign cost centres. Transactions arrive from multiple sources (bank feed, Stripe, Square, cash receipts). Reckon's auto-categorisation is poor. The process is slow and tedious. The monthly report pack (P&L, Balance Sheet, Drinks POS) is then produced from Reckon and emailed to the committee.

---

## Goals

1. Dramatically reduce time spent assigning cost centres to transactions
2. Generate a clean, SBTC-branded monthly report pack as PDFs
3. Keep Reckon as source of truth — no writes until explicitly enabled
4. Start simple (CSV round-trip), automate further once workflow is proven

---

## Non-Goals

- Automated email delivery of reports (treasurer reviews and sends manually)
- Real-time Reckon sync (Phase 1 is CSV-based)
- Multi-user auth (single treasurer user for now)
- Budget forecasting or variance analysis

---

## Monthly Workflow

```
1. Export transactions CSV from Reckon (monthly)
2. Upload CSV into app → Transactions page
3. AI (Claude API) suggests cost centre for each transaction
4. Treasurer reviews: confirm / override / skip each row
5. Export corrected CSV → reimport into Reckon
6. Generate branded monthly report pack (P&L, Balance Sheet, Drinks POS)
7. Download PDFs → send to committee
```

---

## App Structure

### Pages

| Page | Status | Description |
|---|---|---|
| `/` Dashboard | Upgrade | Real YTD figures; key metrics cards |
| `/transactions` | New | Core feature — CSV import, AI categorisation, review, export |
| `/reports` | Upgrade | Branded PDF report generation |
| `/expenses` | Repurpose | Manual transaction entry (cash/receipts not in Reckon) |
| `/budget` | Upgrade | Real figures from P&L data |
| `/settings` | Exists | Reckon config (read-only phase 1) |

### Data Layer

A central `src/lib/financialData.ts` holds the current period's actuals (initially hardcoded from Jan 2026 PDFs, later populated by CSV import). All pages read from this single source.

---

## Feature: Transaction Categorisation

### Input: Reckon CSV Format

Reckon's transaction CSV export (Transactions by Account report) produces rows with these columns:
```
Date, Description, Debit, Credit, Balance, Reference
```
- Date format: `DD/MM/YYYY` (Australian locale)
- Debit/Credit are separate positive columns (not a single signed Amount)
- File includes a header row, potential blank rows, and a "Total" footer row — all must be stripped by the parser
- Encoding: Windows-1252 (Reckon legacy) — parser must handle this

The `csvParser.ts` derives a single signed `amount` as `credit - debit` and a `merchant` key (see LocalStorage Schema below).

### AI Suggestion Engine
- Each transaction is sent to the Claude API **server-side only** via `/api/categorise/route.ts`
- `src/lib/server/categoriser.ts` contains the Anthropic SDK call — it is **never imported by client components**
- Client components call `fetch('/api/categorise', { method: 'POST', body: ... })`
- Claude returns: suggested account code, account name, confidence (`high` / `medium` / `low`)
- On API error: row is marked `low` confidence, manual entry remains available — the review workflow is never blocked
- Low-confidence rows flagged visually; high-confidence rows may be bulk-confirmed
- Confirmed merchant→account mappings cached in `localStorage` for instant re-suggestion on next import

### LocalStorage Schema

```ts
// Key: 'sbtc_merchant_cache'
// Shape:
type MerchantCache = Record<string, { code: string; name: string }>
// Merchant key: description uppercased, split on '*' or spaces,
// take first two tokens — e.g. "SQUARE *BUNNINGS RCKINGHAM" → "SQUARE BUNNINGS"
```

### Review UI
Fast, keyboard-navigable table:
```
Date       Description                Amount    Suggested Cost Centre              Action
2026-01-08 BUNNINGS ROCKINGHAM        $337.45   6-1402 Grounds - Consumables  ✓  [confirm] [edit] [skip]
2026-01-12 TENNIS WA AFFILIATION      $4,029.30 6-1101 Membership - Affiliations ✓  [confirm] [edit] [skip]
2026-01-15 SQUARE *COURT HIRE         $125.00   4-0501 Court Hire              ~  [confirm] [edit] [skip]
```
- `✓` = high confidence, `~` = medium, `?` = low
- Keyboard: Enter = confirm, Tab = next, E = edit, S = skip
- Progress bar: X/Y transactions categorised

### Output: Export CSV Format

The exported CSV is the original Reckon rows verbatim (header stripped, total row stripped) with one column appended:
```
Date, Description, Debit, Credit, Balance, Reference, AccountCode
```
- Date format preserved as `DD/MM/YYYY`
- Encoding: UTF-8 with BOM (Reckon import accepts this)
- Skipped rows: exported with empty `AccountCode` so treasurer can handle manually in Reckon
- Confirmed rows: `AccountCode` column contains the 6-digit code e.g. `6-1402`

---

## Feature: Monthly Report Pack

Three reports generated as styled, printable HTML pages (PDF via browser print):

### 1. P&L Summary
- SBTC logo + header
- Period label (e.g. "For 1 March 2025 to 31 January 2026")
- Income by category group, Expenses by category group
- Net Position highlighted

### 2. Balance Sheet
- As at [date]
- Current Assets, Non-Current Assets, Total Assets
- Equity breakdown

### 3. Drinks POS Report
- Sales, Opening Stock, Purchases, Closing Stock
- Cost of Goods Sold, Profit on Sales, Gross Profit %

All reports: SBTC branding, clean typography, print-optimised CSS.

---

## Data: January 2026 Actuals (seed data)

### P&L Summary (YTD Mar 2025 – Jan 2026)
| Category | Income | Expenses |
|---|---|---|
| Junior Program | $870.02 | $1,442.43 |
| Memberships | $19,036.34 | $4,029.30 |
| Coaching | $4,313.00 | $1,433.00 |
| Events | $5,635.20 | $6,449.21 |
| Tournaments | $4,980.90 | $3,260.59 |
| Pennants | $6,787.48 | $4,829.01 |
| Social Sessions | $8,526.25 | $1,945.40 |
| Other Income | $33,945.76 | — |
| Court Hire | $9,400.60 | — |
| Clubhouse | — | $18,634.92 |
| Courts | — | $5,720.02 |
| Grounds | — | $9,591.39 |
| Other Expenditure | — | $6,088.86 |
| Drink Sales | $7,834.95 | $4,951.11 (COGS) |
| Interest | $4,093.27 | — |
| **TOTAL** | **$105,528.77** | **$63,424.13** |
| **Net Position** | | **$37,153.53** |

### Balance Sheet (as at 31 Jan 2026)
- Total Assets: $242,589.37
- Total Equity: $242,589.37
- Key: Trading Account $37,918.31, Asset Renewal Term Deposit $63,334.88, Building Fundraiser TD $40,517.85

### Drinks POS
- Sales: $7,834.95 | COGS: $4,951.11 | Profit: $2,883.84 | GP%: 37%

---

## Technical Architecture

### Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Claude API (Anthropic SDK) for AI categorisation
- No backend database (Phase 1 — localStorage + CSV files)
- PDF generation via browser print / `window.print()`

### TypeScript Interfaces (defined in `financialData.ts`)

```ts
export interface Transaction {
  date: string           // DD/MM/YYYY
  description: string
  debit: number
  credit: number
  amount: number         // credit - debit (signed)
  reference: string
  accountCode?: string   // assigned cost centre
  confidence?: 'high' | 'medium' | 'low'
  status: 'pending' | 'confirmed' | 'skipped'
}

export interface PnLCategory {
  code: string
  name: string
  income: number
  expenses: number
}

export interface BalanceSheetLine {
  name: string
  code?: string
  amount: number
  section: 'current_assets' | 'non_current_assets' | 'equity'
}

export interface DrinksPOSData {
  periodStart: string
  periodEnd: string
  sales: number
  openingStock: number
  purchases: number
  closingStock: number
  cogs: number
  profit: number
  grossProfitPct: number
}

export interface FinancialPeriod {
  label: string          // e.g. "1 March 2025 to 31 January 2026"
  asAtDate: string       // e.g. "31 January 2026"
  pnl: PnLCategory[]
  balanceSheet: BalanceSheetLine[]
  drinksPOS: DrinksPOSData
}
```

### Phase 1 Notes
- **Balance Sheet data** is manually updated seed data in `financialData.ts` — the treasurer updates it each month alongside the CSV import. It is not derived from transaction categorisation. This is explicit and intentional for Phase 1.
- **`/expenses` page** — repurposed for manual cash/receipt entry. Transactions entered here are stored in `localStorage` key `sbtc_manual_transactions` (array of `Transaction`) and included in the exported CSV. Dashboard totals do NOT include manual transactions in Phase 1 (they are not yet reconciled with Reckon figures).

### Key Files
```
src/
  lib/
    accounts.ts               # Chart of accounts (exists)
    financialData.ts          # NEW — types + Jan 2026 seed data
    csvParser.ts              # NEW — parse Reckon CSV (handles debit/credit, strips headers)
    server/
      categoriser.ts          # NEW — Anthropic SDK call (server-only, never client-imported)
  app/
    api/
      categorise/
        route.ts              # NEW — POST endpoint, calls categoriser.ts
    transactions/             # NEW — import, review, export pages
    reports/                  # UPGRADE — branded report components
  components/
    transactions/             # NEW — ReviewTable, ProgressBar, ExportButton
    reports/                  # NEW — PLReport, BalanceSheetReport, DrinksReport
    dashboard/                # UPGRADE — real data from financialData.ts
```

### Environment Variables
```
ANTHROPIC_API_KEY=     # For AI categorisation (server-side API route)
```

---

## Multi-Agent Implementation Tracks

Designed for parallel execution:

### Track A — Data Foundation
`financialData.ts` seed data + types. Dashboard upgraded with real figures. Budget page upgraded. No dependencies on other tracks.

### Track B — Transaction Categorisation
CSV parser + Claude API categoriser + `/transactions` page + ReviewTable UI. Depends on Track A types only.

### Track C — Report Generation
Branded report components for P&L, Balance Sheet, Drinks POS. `/reports` page upgraded. Depends on Track A data only.

### Track D — Infrastructure
`ANTHROPIC_API_KEY` env var wired into Vercel. API route `/api/categorise` created. Depends on nothing.

**Execution order:** A + D in parallel first → B + C in parallel → integration test.

---

## Out of Scope (Phase 2+)
- Reckon API direct integration
- Automated CSV export scheduling
- Automated email delivery of report pack
- Multi-user / role-based access
- Historical data beyond current financial year
