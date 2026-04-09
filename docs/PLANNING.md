# Tennis Treasury — Architecture & Planning Notes

## Data Flow (as of April 2026)

### Financial Period Data (Static)

Reckon P&L and Balance Sheet snapshots are manually entered in `src/lib/financialData.ts`
after each month-end export. The Dashboard KPI cards, charts, and bank balances all read
from the `PERIODS` registry. `getFinancialData()` has a TODO for live fetch — not yet active.

### Live Transaction Data (Square + Reckon → sessionStorage → Allocation)

The Dashboard period selector is the single trigger for fetching live transaction data:

1. User selects a period on the Dashboard (`src/app/page.tsx`)
2. `dataLoader.ts → periodToDateRange()` converts the period key to a YTD ISO date range (always from `2025-03-01T00:00:00Z`)
3. `dataLoader.ts → loadPeriodData()` calls `/api/square/payments` and `/api/reckon/transactions` in parallel
4. Square route (`src/app/api/square/payments/route.ts`) calls Square Orders API → line items → `Transaction[]`
5. Reckon route (`src/app/api/reckon/[endpoint]/route.ts`) calls `getLedgerTransactions()` → flat `ReckonTransaction[]` → mapped by `reckonTransactionToTransaction()` to `Transaction[]`
6. Results are deduplicated (composite key: `date|description|amount|reference`) and written to `sessionStorage` via `dataCache.ts`
7. The Allocation page reads the cache on mount

```
Dashboard (period selector)
       │ onChange
       ▼
  dataLoader.ts
  periodToDateRange()  →  { from: '2025-03-01T00:00:00Z', to: '[end of period]' }
  loadPeriodData()     →  Promise.all([fetchSquare(), fetchReckon()])
                          dedup
                          return LoadResult { transactions, sources }
       │
       ▼
  dataCache.ts
  setCachedPeriod()    →  sessionStorage['sbtc_cache_{period}']
  setActivePeriodKey() →  sessionStorage['sbtc_active_period']
       │
       ▼
  Allocation Page (on mount)
  getActivePeriodKey() + getCachedPeriod()
  → pre-populates ReviewTable
```

### Reckon OAuth Integration (LIVE — April 2026)

**Status:** Credentials configured in `.env.local`. OAuth flow implemented.

**Flow:**
1. Settings page shows "Not connected" → treasurer clicks "Connect to Reckon One →"
2. Browser navigates to `/api/reckon/auth` → server calls `getAuthorizationUrl()` → redirect to `identity.reckon.com`
3. Treasurer logs in → Reckon redirects to `/api/reckon/callback?code=...&state=...`
4. Callback route validates CSRF state → calls `exchangeCodeForTokens(code)`
5. Tokens stored in memory + `.reckon-tokens.json` (gitignored)
6. Future API calls: `getAccessToken()` auto-refreshes when within 5min of expiry

**Token storage:**
- Server-side in-memory (`_tokens` in `auth.ts`) + file backup at `.reckon-tokens.json`
- File persists across server restarts
- Tokens NEVER go to browser, localStorage, or cookies
- Treasurer only needs to authenticate once — refresh token handles subsequent sessions

**Key env vars required:**
- `RECKON_CLIENT_ID`
- `RECKON_CLIENT_SECRET`
- `RECKON_SUBSCRIPTION_KEY`
- `RECKON_BOOK_ID` = `7f71d29b-8720-422d-8382-d961bb783990`
- `RECKON_REDIRECT_URI` = `http://127.0.0.1:3000/api/reckon/callback`

**Endpoint paths (base: `https://api.reckon.com/r1/v2/{bookId}`):**
- `GET /transactions?filter=transactionDate ge '...' and transactionDate le '...'`
- `GET /ledgeraccounts`
- `GET /bankaccounts`
- `GET /reports/profitandloss?startDate=...&endDate=...`

**Note on Reckon account names → cost centres:**
`reckonTransactionToTransaction()` in `transforms.ts` attempts to match `accountName`
(e.g. "Clubhouse - Electricity") against `COST_CENTRES[].label` (case-insensitive).
Where the Reckon account name exactly matches a cost centre label, the mapping is automatic.
This means ~70% of Reckon transactions will be auto-classified.

### Square API Integration

- Access token: `SQUARE_ACCESS_TOKEN` (server-side env only)
- Orders endpoint: `src/lib/square/api.ts → searchOrders()`
- Catalog cache (categories): `src/lib/square/catalog.ts`
- Line item → Transaction mapping: `src/lib/square/transforms.ts`
- Cost centre auto-matching: `src/lib/costCentres.ts → SQUARE_CATEGORY_MAP`

### CSV Upload (Fallback)

Reckon, Square CSV, and Stripe workflows still work via CSV upload in
`src/components/transactions/CsvUpload.tsx`. Square CSV upload is available
as a fallback when the live API is not responding.

### Pending

- **Dashboard wiring**: `src/app/page.tsx` needs to call `loadPeriodData()` on period change
  and wire `DataLoadingPanel` / `CacheStatusBar` — see period-driven data loading plan.
- **Allocation page wiring**: `src/app/transactions/page.tsx` needs to read from cache on mount.
- **Live Reckon P&L → `getFinancialData()`**: The `PERIODS` static registry will eventually
  be replaced by live Reckon P&L fetch — not yet implemented.
- **Stripe integration**: CSV upload works; live API fetch not yet implemented.
- **Split allocation**: Plan at `docs/superpowers/plans/2026-04-01-split-cost-centre-allocation.md`.
