# Tennis Treasury — Architecture & Planning Notes

## Data Flow (as of April 2026)

### Financial Period Data (Static)

Reckon P&L and Balance Sheet snapshots are manually entered in `src/lib/financialData.ts` after each month-end export. The Dashboard KPI cards, charts, and bank balances all read from the `PERIODS` registry. No live Reckon API is connected yet.

### Live Transaction Data (Square → sessionStorage → Allocation)

The Dashboard period selector is the single trigger for fetching live transaction data:

1. User selects a period on the Dashboard (`src/app/page.tsx`)
2. `dataLoader.ts → periodToDateRange()` converts the period key to a YTD ISO date range (always from `2025-03-01`)
3. `dataLoader.ts → loadPeriodData()` calls `/api/square/payments?from=...&to=...`
4. The API route (`src/app/api/square/payments/route.ts`) calls Square Orders API and expands line items into `Transaction[]`
5. Result is deduplicated (composite key: `date|description|amount|reference`) and written to `sessionStorage` via `dataCache.ts`
6. Cache key: `sbtc_cache_{periodKey}` · Active period key: `sbtc_active_period`
7. The Allocation page (`src/app/transactions/page.tsx`) reads the cache on mount

```
Dashboard (period selector)
       │ onChange
       ▼
  dataLoader.ts
  periodToDateRange()  →  { from: '2025-03-01T00:00:00Z', to: '[end of period]' }
  loadPeriodData()     →  fetch /api/square/payments
                          dedup
                          return LoadResult
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

### CSV Upload (Fallback)

The Reckon, Square CSV, and Stripe workflows still work via CSV upload in `src/components/transactions/CsvUpload.tsx`. This is the only path for Reckon data while the Reckon API integration (`src/lib/reckon/`) remains a stub. Square CSV upload also remains available as a fallback.

When the user clicks "Upload new file" on the Allocation page, the active period's cache is cleared from sessionStorage so a page reload does not re-hydrate the old data.

### Square API Integration

- Access token: `SQUARE_ACCESS_TOKEN` (server-side env only)
- Orders endpoint: `src/lib/square/api.ts → searchOrders()`
- Catalog cache (categories): `src/lib/square/catalog.ts`
- Line item → Transaction mapping: `src/lib/square/transforms.ts`
- Cost centre auto-matching: `src/lib/costCentres.ts → SQUARE_CATEGORY_MAP`

### Pending

- **Reckon live API**: `src/lib/reckon/` is stubbed. When Reckon credentials arrive, `getFinancialData()` in `financialData.ts` will switch to live fetch. The `PERIODS` static registry will eventually be retired.
- **Stripe integration**: Stripe CSV upload works; live fetch not yet implemented.
- **Multi-source cache**: `PeriodCache.sources` tracks which sources loaded data. Currently only Square writes to the cache. Reckon/Stripe will extend this when implemented — see TODO in `src/app/transactions/page.tsx`.
- **Split allocation**: Plan written at `docs/superpowers/plans/2026-04-01-split-cost-centre-allocation.md` — not yet executed.
- **Financial year rollover**: `FY_START` in `dataLoader.ts` is hardcoded to `2025-03-01`. Update when the financial year rolls over — see TODO in that file.
