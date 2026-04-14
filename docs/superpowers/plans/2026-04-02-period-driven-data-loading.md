# Period-Driven Data Loading with Cache — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Dashboard period selector the single trigger for fetching Square transactions, caching results in sessionStorage, so the Allocation page consumes live data instead of requiring a CSV upload.

**Architecture:** When a period is selected on the Dashboard, the app checks `sessionStorage` for a cached result; on miss it calls `/api/square/payments` and writes the result back. The Allocation page reads the same cache on mount. CSV upload is preserved as a fallback for Reckon/Stripe workflows. Static `PERIODS` financial data (KPI cards, charts) is unchanged.

**Tech Stack:** Next.js 16 App Router (`'use client'` components), TypeScript 5, Vitest 2 (`environment: 'node'`), sessionStorage

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/dataCache.ts` | sessionStorage read/write; `PeriodCache` type |
| Create | `src/lib/__tests__/dataCache.test.ts` | Unit tests for cache CRUD |
| Create | `src/lib/dataLoader.ts` | `periodToDateRange`, `loadPeriodData`, dedup |
| Create | `src/lib/__tests__/dataLoader.test.ts` | Unit tests for date range + dedup |
| Create | `src/components/DataLoadingPanel.tsx` | Spinner shown while loading |
| Create | `src/components/CacheStatusBar.tsx` | Count + age + Refresh + Clear shown after load |
| Modify | `src/app/page.tsx` | Wire period selector → auto-load → cache status |
| Modify | `src/app/transactions/page.tsx` | Read cache on mount; CSV upload as fallback |
| Create | `docs/PLANNING.md` | Architecture documentation |

---

### Task 1: sessionStorage cache layer (`src/lib/dataCache.ts`)

**Files:**
- Create: `src/lib/dataCache.ts`
- Create: `src/lib/__tests__/dataCache.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/dataCache.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCachedPeriod, setCachedPeriod, clearCachedPeriod, getActivePeriodKey, setActivePeriodKey } from '../dataCache'
import type { PeriodCache } from '../dataCache'

const store: Record<string, string> = {}
const mockStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
  vi.stubGlobal('sessionStorage', mockStorage)
})

const SAMPLE: PeriodCache = {
  periodKey: 'jan-2026',
  transactions: [],
  loadedAt: '2026-04-01T10:00:00.000Z',
  sources: { square: true, reckon: false, stripe: false },
}

describe('getCachedPeriod', () => {
  it('returns null when no cache exists', () => {
    expect(getCachedPeriod('jan-2026')).toBeNull()
  })
  it('returns cached value after setCachedPeriod', () => {
    setCachedPeriod(SAMPLE)
    expect(getCachedPeriod('jan-2026')).toEqual(SAMPLE)
  })
  it('returns null after clearCachedPeriod', () => {
    setCachedPeriod(SAMPLE)
    clearCachedPeriod('jan-2026')
    expect(getCachedPeriod('jan-2026')).toBeNull()
  })
})

describe('active period key', () => {
  it('returns null when not set', () => {
    expect(getActivePeriodKey()).toBeNull()
  })
  it('returns key after setActivePeriodKey', () => {
    setActivePeriodKey('jan-2026')
    expect(getActivePeriodKey()).toBe('jan-2026')
  })
  it('overwrites previous active key', () => {
    setActivePeriodKey('dec-2025')
    setActivePeriodKey('jan-2026')
    expect(getActivePeriodKey()).toBe('jan-2026')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/dataCache.test.ts`
Expected: FAIL with "Cannot find module '../dataCache'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/dataCache.ts
import type { Transaction } from '@/lib/financialData'

export interface PeriodCache {
  periodKey: string
  transactions: Transaction[]
  loadedAt: string  // ISO 8601 — must be string, not Date, for JSON.stringify
  sources: { square: boolean; reckon: boolean; stripe: boolean }
}

const CACHE_PREFIX = 'sbtc_cache_'
const ACTIVE_KEY = 'sbtc_active_period'

function storage(): Storage | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

export function getCachedPeriod(periodKey: string): PeriodCache | null {
  const raw = storage()?.getItem(CACHE_PREFIX + periodKey) ?? null
  if (!raw) return null
  try {
    return JSON.parse(raw) as PeriodCache
  } catch {
    return null
  }
}

export function setCachedPeriod(cache: PeriodCache): void {
  try {
    storage()?.setItem(CACHE_PREFIX + cache.periodKey, JSON.stringify(cache))
  } catch {
    // sessionStorage quota exceeded — silently ignore
  }
}

export function clearCachedPeriod(periodKey: string): void {
  storage()?.removeItem(CACHE_PREFIX + periodKey)
}

export function getActivePeriodKey(): string | null {
  return storage()?.getItem(ACTIVE_KEY) ?? null
}

export function setActivePeriodKey(periodKey: string): void {
  storage()?.setItem(ACTIVE_KEY, periodKey)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/dataCache.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dataCache.ts src/lib/__tests__/dataCache.test.ts
git commit -m "feat: add sessionStorage period cache (dataCache.ts)"
```

---

### Task 2: Data loader — fetch orchestrator + date mapping + dedup (`src/lib/dataLoader.ts`)

**Files:**
- Create: `src/lib/dataLoader.ts`
- Create: `src/lib/__tests__/dataLoader.test.ts`

**Note on client-side Square fetch:** `getSquareTransactions` from `financialData.ts` guards behind `isSquareConfigured()`, which reads `process.env.SQUARE_ACCESS_TOKEN` — always undefined in the browser. `dataLoader.ts` calls the API route directly to avoid this.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/dataLoader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { periodToDateRange, loadPeriodData } from '../dataLoader'
import type { Transaction } from '@/lib/financialData'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date: '01/04/2026', description: 'Test', amount: 10,
    debit: 0, credit: 10, reference: 'REF1',
    status: 'pending', source: 'square',
    ...overrides,
  }
}

describe('periodToDateRange', () => {
  it('always starts from FY_START', () => {
    expect(periodToDateRange('jan-2026').from).toBe('2025-03-01T00:00:00Z')
    expect(periodToDateRange('dec-2025').from).toBe('2025-03-01T00:00:00Z')
  })

  it('jan-2026 ends on 2026-01-31', () => {
    expect(periodToDateRange('jan-2026').to).toMatch(/^2026-01-31/)
  })

  it('dec-2025 ends on 2025-12-31', () => {
    expect(periodToDateRange('dec-2025').to).toMatch(/^2025-12-31/)
  })

  it('full-year to is today', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(periodToDateRange('full-year').to).toMatch(new RegExp(`^${today}`))
  })
})

describe('loadPeriodData', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('deduplicates transactions with identical composite key', async () => {
    const tx = makeTx()
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx, tx] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.transactions).toHaveLength(1)
  })

  it('keeps transactions with different references', async () => {
    const tx1 = makeTx({ reference: 'A' })
    const tx2 = makeTx({ reference: 'B' })
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx1, tx2] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.transactions).toHaveLength(2)
  })

  it('marks square source as true when transactions returned', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [makeTx()] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe(true)
  })

  it('marks square source as false when API returns empty array', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe(false)
  })

  it('marks square source as false and returns [] when API errors', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 502 } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe(false)
    expect(result.transactions).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/dataLoader.test.ts`
Expected: FAIL with "Cannot find module '../dataLoader'"

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/dataLoader.ts
import type { Transaction } from '@/lib/financialData'

export interface LoadResult {
  transactions: Transaction[]
  sources: { square: boolean; reckon: boolean; stripe: boolean }
}

const FY_START = '2025-03-01T00:00:00Z'

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

export function periodToDateRange(periodKey: string): { from: string; to: string } {
  if (periodKey === 'full-year') {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return { from: FY_START, to: today.toISOString() }
  }
  const [mon, yr] = periodKey.split('-')
  const year = Number(yr)
  const monthIndex = MONTH_INDEX[mon] ?? 0
  // day 0 of next month = last day of this month
  const lastDay = new Date(year, monthIndex + 1, 0)
  lastDay.setHours(23, 59, 59, 999)
  return { from: FY_START, to: lastDay.toISOString() }
}

function txKey(t: Transaction): string {
  return `${t.date}|${t.description}|${t.amount}|${t.reference}`
}

function dedup(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>()
  return transactions.filter(t => {
    const k = txKey(t)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

async function fetchSquare(from: string, to: string): Promise<Transaction[]> {
  try {
    const params = new URLSearchParams({ from, to })
    const res = await fetch(`/api/square/payments?${params}`)
    if (!res.ok) return []
    return await res.json() as Transaction[]
  } catch {
    return []
  }
}

export async function loadPeriodData(periodKey: string): Promise<LoadResult> {
  const { from, to } = periodToDateRange(periodKey)
  const squareTxns = await fetchSquare(from, to)
  return {
    transactions: dedup(squareTxns),
    sources: { square: squareTxns.length > 0, reckon: false, stripe: false },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/dataLoader.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: all existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/dataLoader.ts src/lib/__tests__/dataLoader.test.ts
git commit -m "feat: add data loader with period date mapping and dedup (dataLoader.ts)"
```

---

### Task 3: Loading UI components

**Files:**
- Create: `src/components/DataLoadingPanel.tsx`
- Create: `src/components/CacheStatusBar.tsx`

No tests — these are pure-display components with no business logic.

- [ ] **Step 1: Create DataLoadingPanel**

```tsx
// src/components/DataLoadingPanel.tsx
'use client'

interface Props {
  periodLabel: string
}

export default function DataLoadingPanel({ periodLabel }: Props) {
  return (
    <div className="card flex items-center gap-3 py-3 px-4">
      <div
        className="h-4 w-4 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--brand)' }}
      />
      <span className="text-sm" style={{ color: 'var(--text-2)' }}>
        Loading {periodLabel} from Square…
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create CacheStatusBar**

```tsx
// src/components/CacheStatusBar.tsx
'use client'

interface Props {
  loadedAt: string  // ISO 8601
  count: number
  sources: { square: boolean; reckon: boolean; stripe: boolean }
  onRefresh: () => void
  onClear: () => void
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function CacheStatusBar({ loadedAt, count, sources, onRefresh, onClear }: Props) {
  const activeSources = (Object.entries(sources) as [string, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k)

  return (
    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
      <span>
        {count} transactions loaded {timeAgo(loadedAt)}
        {activeSources.length > 0 && (
          <> · <span style={{ color: 'var(--brand)' }}>{activeSources.join(', ')}</span></>
        )}
      </span>
      <button onClick={onRefresh} className="underline hover:opacity-70">
        Refresh
      </button>
      <button onClick={onClear} className="underline hover:opacity-70">
        Clear
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/DataLoadingPanel.tsx src/components/CacheStatusBar.tsx
git commit -m "feat: add DataLoadingPanel and CacheStatusBar UI components"
```

---

### Task 4: Wire Dashboard to period cache (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`

**Behaviour:** On period change, check cache; if miss, auto-load. Static financial data (KPI cards, charts) still reads from `PERIODS` — unchanged. New UI: DataLoadingPanel (while loading) or CacheStatusBar (after load) sits below the period selector row.

- [ ] **Step 1: Read the current file before editing**

Read `src/app/page.tsx` (already shown above — confirms imports and state shape).

- [ ] **Step 2: Replace the file with the updated version**

```tsx
// src/app/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { PERIODS, LATEST_PERIOD_KEY, PERIOD_LABELS } from '@/lib/financialData'
import { getCachedPeriod, setCachedPeriod, clearCachedPeriod, setActivePeriodKey } from '@/lib/dataCache'
import { loadPeriodData } from '@/lib/dataLoader'
import type { PeriodCache } from '@/lib/dataCache'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import DataLoadingPanel from '@/components/DataLoadingPanel'
import CacheStatusBar from '@/components/CacheStatusBar'
import KpiCards from '@/components/dashboard/KpiCards'
import BankBalances from '@/components/dashboard/BankBalances'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import QuickActions from '@/components/dashboard/QuickActions'
import AiChatPlaceholder from '@/components/dashboard/AiChatPlaceholder'

export default function DashboardPage() {
  const [periodKey, setPeriodKey] = useState<string>('full-year')
  const [isLoading, setIsLoading] = useState(false)
  const [cache, setCache] = useState<PeriodCache | null>(null)

  const resolvedKey = periodKey === 'full-year' ? LATEST_PERIOD_KEY : periodKey
  const period = PERIODS[resolvedKey]
  const periodLabel = periodKey === 'full-year' ? 'Full Year 2025-26' : (PERIOD_LABELS[periodKey] ?? periodKey)

  const triggerLoad = useCallback(async (key: string) => {
    setIsLoading(true)
    try {
      const result = await loadPeriodData(key)
      const newCache: PeriodCache = {
        periodKey: key,
        transactions: result.transactions,
        loadedAt: new Date().toISOString(),
        sources: result.sources,
      }
      setCachedPeriod(newCache)
      setCache(newCache)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setActivePeriodKey(periodKey)
    const cached = getCachedPeriod(periodKey)
    if (cached) {
      setCache(cached)
    } else {
      setCache(null)
      triggerLoad(periodKey)
    }
  }, [periodKey, triggerLoad])

  function handleRefresh() {
    clearCachedPeriod(periodKey)
    setCache(null)
    triggerLoad(periodKey)
  }

  function handleClear() {
    clearCachedPeriod(periodKey)
    setCache(null)
  }

  if (!period) {
    return (
      <div className="card text-center py-12" style={{ color: 'var(--text-3)' }}>
        No data available for this period yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>
          Dashboard
        </h1>
        <PeriodSelector value={periodKey} onChange={setPeriodKey} />
      </div>

      {/* Live data status */}
      {isLoading && <DataLoadingPanel periodLabel={periodLabel} />}
      {!isLoading && cache && (
        <CacheStatusBar
          loadedAt={cache.loadedAt}
          count={cache.transactions.length}
          sources={cache.sources}
          onRefresh={handleRefresh}
          onClear={handleClear}
        />
      )}

      {/* KPI row — static financial data, unchanged */}
      <KpiCards period={period} />

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <CategoryBarChart period={period} mode="income" />
        <CategoryBarChart period={period} mode="expense" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CategoryPieChart period={period} mode="income" />
        <CategoryPieChart period={period} mode="expense" />
      </div>

      {/* Monthly trend — only on full year */}
      {periodKey === 'full-year' && <MonthlyTrendChart />}

      {/* Bank balances + quick actions */}
      <div className="grid grid-cols-[1fr_400px] gap-4 items-start">
        <BankBalances period={period} />
        <div className="space-y-4">
          <QuickActions />
        </div>
      </div>

      {/* AI chat */}
      <AiChatPlaceholder />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Verify existing tests still pass**

Run: `npx vitest run`
Expected: all tests pass (no regressions)

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire dashboard period selector to Square data fetch + sessionStorage cache"
```

---

### Task 5: Allocation page as cache consumer (`src/app/transactions/page.tsx`)

**Files:**
- Modify: `src/app/transactions/page.tsx`

**Behaviour:**
- On mount: read active period key + cache from sessionStorage
- If cache has transactions: show ReviewTable pre-populated (same flow as uploading a CSV)
- If no cache: show CsvUpload with a note pointing to the Dashboard (preserves Reckon workflow)
- "Upload new file" button still available to override cache with a CSV

- [ ] **Step 1: Read the current file before editing**

Read `src/app/transactions/page.tsx` (already shown above — confirms the `handleLoaded`, `handleExport`, empty-state render shape).

- [ ] **Step 2: Replace the file with the updated version**

```tsx
// src/app/transactions/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { CsvUpload } from '@/components/transactions/CsvUpload'
import { ReviewTable } from '@/components/transactions/ReviewTable'
import { ProgressBar } from '@/components/transactions/ProgressBar'
import { ExportButton } from '@/components/transactions/ExportButton'
import ReconciliationGate from '@/components/allocation/ReconciliationGate'
import type { Transaction } from '@/lib/financialData'
import type { CsvSource } from '@/lib/csvParser'
import { serialiseToReckonCsv } from '@/lib/csvParser'
import { getCachedPeriod, getActivePeriodKey } from '@/lib/dataCache'
import { PERIOD_LABELS } from '@/lib/financialData'

export default function AllocationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [source, setSource] = useState<CsvSource | null>(null)
  const [cacheLabel, setCacheLabel] = useState<string | null>(null)

  // On mount, hydrate from cache if available
  useEffect(() => {
    const periodKey = getActivePeriodKey()
    if (!periodKey) return
    const cached = getCachedPeriod(periodKey)
    if (cached && cached.transactions.length > 0) {
      setTransactions(cached.transactions)
      setSource('square')
      const label = periodKey === 'full-year'
        ? 'Full Year 2025-26'
        : (PERIOD_LABELS[periodKey] ?? periodKey)
      setCacheLabel(label)
    }
  }, [])

  function handleLoaded(txns: Transaction[], src: CsvSource) {
    setTransactions(txns)
    setSource(src)
    setCacheLabel(null)
  }

  function handleReset() {
    setTransactions([])
    setSource(null)
    setCacheLabel(null)
  }

  function handleExport() {
    const csv = serialiseToReckonCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sbtc-reconciled-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Select a period on the Dashboard to load Square transactions, or upload a CSV from Reckon, Square POS, or Stripe below.
        </p>
        <CsvUpload onLoaded={handleLoaded} />
      </div>
    )
  }

  const confirmed = transactions.filter(t => t.status === 'confirmed').length
  const skipped   = transactions.filter(t => t.status === 'skipped').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {transactions.length} transactions · source: <strong>{source}</strong>
            {cacheLabel && (
              <span> · period: <strong>{cacheLabel}</strong></span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButton transactions={transactions} />
          <button onClick={handleReset} className="btn-secondary text-sm">
            Upload new file
          </button>
        </div>
      </div>

      <ProgressBar confirmed={confirmed} skipped={skipped} total={transactions.length} />
      <ReviewTable transactions={transactions} onChange={setTransactions} />
      <ReconciliationGate transactions={transactions} onConfirm={handleExport} />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/app/transactions/page.tsx
git commit -m "feat: allocation page reads Square data from sessionStorage cache on mount"
```

---

### Task 6: Architecture documentation (`docs/PLANNING.md`)

**Files:**
- Create: `docs/PLANNING.md`

- [ ] **Step 1: Create the file**

```markdown
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

### Square API Integration

- Access token: `SQUARE_ACCESS_TOKEN` (server-side env only)
- Orders endpoint: `src/lib/square/api.ts → searchOrders()`
- Catalog cache (categories): `src/lib/square/catalog.ts`
- Line item → Transaction mapping: `src/lib/square/transforms.ts`
- Cost centre auto-matching: `src/lib/costCentres.ts → SQUARE_CATEGORY_MAP`

### Pending

- **Reckon live API**: `src/lib/reckon/` is stubbed. When Reckon credentials arrive, `getFinancialData()` in `financialData.ts` will switch to live fetch. The `PERIODS` static registry will eventually be retired.
- **Stripe integration**: Stripe CSV upload works; live fetch not yet implemented.
- **Split allocation**: Plan written at `docs/superpowers/plans/2026-04-01-split-cost-centre-allocation.md` — not yet executed.
```

- [ ] **Step 2: Commit**

```bash
git add docs/PLANNING.md
git commit -m "docs: add PLANNING.md with data flow architecture"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Covered in |
|---|---|
| Period selector is the fetch trigger | Task 4 — `useEffect` on `periodKey` |
| sessionStorage cache per period | Task 1 — `dataCache.ts` |
| Loading panel while fetching | Task 3, 4 — `DataLoadingPanel` |
| CacheStatusBar with count + age | Task 3, 4 — `CacheStatusBar` |
| Allocation page reads from cache | Task 5 |
| CSV upload preserved as fallback | Task 5 — empty state still shows `CsvUpload` |
| `docs/PLANNING.md` with architecture | Task 6 |
| Refresh + Clear cache | Task 3, 4 |
| `periodToDateRange` all periods | Task 2 |
| Deduplication | Task 2 |
| `loadedAt` as ISO string (not Date) | Task 1 — type comment explains why |

**Placeholder scan:** None found.

**Type consistency:**
- `PeriodCache` defined in `dataCache.ts`, imported in `page.tsx` (Task 4) ✓
- `LoadResult` defined in `dataLoader.ts`, used only internally ✓
- `CacheStatusBar` props match usage in `page.tsx` ✓
- `DataLoadingPanel` props match usage in `page.tsx` ✓
