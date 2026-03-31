# SBTC Treasury Dashboard Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sidebar-based treasurer app with a clean top-nav app (Dashboard + Allocation + Settings) matching the `index.html` visual style, using real FY 2025-26 data.

**Architecture:** Big Bang — delete dead code, replace root layout with TopNav, build each tab from scratch while reusing `src/lib/` and `src/components/transactions/` and `src/components/reports/`. No new npm dependencies.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript 5, Tailwind CSS 3 + `@tailwindcss/forms`, Recharts 2, `@anthropic-ai/sdk` 0.80, `next/font/google` (DM Sans / DM Mono), Vitest 2

---

## File Map

### Delete
```
src/app/expenses/page.tsx
src/app/expenses/new/page.tsx
src/app/members/page.tsx
src/app/budget/page.tsx
src/components/expenses/ExpenseForm.tsx
src/components/expenses/ExpenseList.tsx
src/components/members/UserManagement.tsx
src/components/budget/BudgetTracker.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Header.tsx
src/components/dashboard/RecentExpenses.tsx
src/components/dashboard/BudgetOverview.tsx
```

### Create
```
src/components/layout/TopNav.tsx            — sticky dark-navy nav, 3 tabs, gear icon
src/components/dashboard/PeriodSelector.tsx — month/full-year dropdown
src/components/dashboard/KpiCards.tsx       — 4 metric cards (Income, Expenses, Net, COGS)
src/components/dashboard/BankBalances.tsx   — 6 bank accounts grouped
src/components/dashboard/CategoryBarChart.tsx  — income or expense horizontal bar (Recharts)
src/components/dashboard/CategoryPieChart.tsx  — income or expense donut (Recharts)
src/components/dashboard/MonthlyTrendChart.tsx — net position per month line chart (Recharts)
src/components/dashboard/QuickActions.tsx      — "Go to Allocation" + "View Reports" buttons
src/components/dashboard/AiChatPlaceholder.tsx — static chat UI
src/components/allocation/ReconciliationGate.tsx — disabled/enabled button + modal
```

### Modify
```
src/app/layout.tsx                         — remove Sidebar/Header, add TopNav, add DM fonts
src/app/page.tsx                           — rewrite as Dashboard
src/app/transactions/page.tsx              — add source detection, bulk accept, recon gate
src/app/settings/page.tsx                  — 4 sections + localStorage
src/app/globals.css                        — add CSS custom properties, update .card/.btn-*
tailwind.config.js                         — add fontFamily for DM Sans/DM Mono
src/lib/financialData.ts                   — add source field to Transaction, add PERIODS map
src/lib/csvParser.ts                       — add Square + Stripe parsers + detectCsvSource
src/lib/__tests__/csvParser.test.ts        — add tests for new parsers + detectCsvSource
src/lib/server/categoriser.ts              — enrich prompt with allocation rules
src/components/transactions/CsvUpload.tsx  — detect source, call right parser
src/components/transactions/ReviewTable.tsx — add Source column + bulk accept button
src/components/reports/PLReport.tsx        — restyle to CSS variable tokens
src/components/reports/BalanceSheetReport.tsx — restyle
src/components/reports/DrinksReport.tsx    — restyle
```

### Keep as-is
```
src/lib/accounts.ts
src/lib/merchantCache.ts
src/app/api/categorise/route.ts
src/components/transactions/ExportButton.tsx
src/components/transactions/ProgressBar.tsx
src/lib/__tests__/financialData.test.ts
```

---

## Task 1: Delete Dead Code

**Files:** Delete all paths in the "Delete" section above.

- [ ] **Step 1: Delete unused app routes**

```bash
rm -rf src/app/expenses src/app/members src/app/budget
```

- [ ] **Step 2: Delete unused components**

```bash
rm src/components/expenses/ExpenseForm.tsx
rm src/components/expenses/ExpenseList.tsx
rm src/components/members/UserManagement.tsx
rm src/components/budget/BudgetTracker.tsx
rm src/components/layout/Sidebar.tsx
rm src/components/layout/Header.tsx
rm src/components/dashboard/RecentExpenses.tsx
rm src/components/dashboard/BudgetOverview.tsx
```

- [ ] **Step 3: Verify nothing imports deleted files**

```bash
grep -r "Sidebar\|Header\|UserManagement\|ExpenseForm\|ExpenseList\|BudgetTracker\|RecentExpenses\|BudgetOverview" src/ --include="*.tsx" --include="*.ts" -l
```

Expected: no output (or only the component files themselves if not deleted yet).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete unused pages and components"
```

---

## Task 2: Theme Foundation

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update tailwind.config.js to add font families**

Replace the full contents of `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: '#1D9E75',
        navy: '#1e3a5f',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

- [ ] **Step 2: Replace globals.css with brand tokens and updated component classes**

Replace the full contents of `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --brand:        #1D9E75;
  --brand-dk:     #157a5a;
  --nav:          #1e3a5f;
  --bg:           #f2f5f8;
  --surface:      #ffffff;
  --border:       #dde3ea;
  --border-w:     1.5px;
  --radius:       14px;
  --text-1:       #111827;
  --text-2:       #374151;
  --text-3:       #6b7280;
  --green:        #15803d;
  --amber:        #b45309;
  --red:          #b91c1c;
}

@layer base {
  html {
    font-family: var(--font-sans), system-ui, sans-serif;
    color: var(--text-1);
  }
  body {
    background: var(--bg);
  }
}

@layer components {
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    border: var(--border-w) solid var(--border);
    padding: 22px;
  }

  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 font-medium transition-colors;
    background: var(--brand);
    color: white;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.875rem;
  }
  .btn-primary:hover { background: var(--brand-dk); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 font-medium transition-colors;
    background: white;
    color: var(--text-2);
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 0.875rem;
    border: var(--border-w) solid var(--border);
  }
  .btn-secondary:hover { background: var(--bg); }

  .input-field {
    display: block;
    width: 100%;
    padding: 8px 12px;
    background: white;
    border: var(--border-w) solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    color: var(--text-1);
  }
  .input-field:focus {
    outline: none;
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(29,158,117,0.15);
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--text-3);
  }
}

@media print {
  nav, .no-print { display: none !important; }
  body { background: white; }
  .card { box-shadow: none; }
  .print-break { page-break-before: always; }
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js src/app/globals.css
git commit -m "style: add brand CSS variables and update Tailwind config"
```

---

## Task 3: TopNav Component

**Files:**
- Create: `src/components/layout/TopNav.tsx`

- [ ] **Step 1: Create TopNav.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'

const TABS = [
  { label: 'Dashboard',  href: '/' },
  { label: 'Allocation', href: '/transactions' },
  { label: 'Settings',   href: '/settings' },
]

export default function TopNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center h-14 px-6 gap-2"
      style={{ background: 'var(--nav)' }}
    >
      {/* Logo */}
      <span className="text-white font-bold text-base mr-6 shrink-0">
        SBTC Treasury
      </span>

      {/* Tabs */}
      <div className="flex gap-1 flex-1">
        {TABS.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-1.5 rounded text-sm font-medium transition-colors"
            style={
              isActive(tab.href)
                ? { background: 'var(--brand)', color: 'white' }
                : { color: 'rgba(255,255,255,0.7)' }
            }
            onMouseEnter={e => {
              if (!isActive(tab.href)) {
                (e.currentTarget as HTMLElement).style.color = 'white'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive(tab.href)) {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Settings icon */}
      <Link
        href="/settings"
        className="text-white/60 hover:text-white transition-colors"
        aria-label="Settings"
      >
        <Settings size={18} />
      </Link>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/TopNav.tsx
git commit -m "feat: add TopNav component"
```

---

## Task 4: Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Rewrite layout.tsx to use TopNav and DM fonts**

```tsx
import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import TopNav from '@/components/layout/TopNav'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SBTC Treasury',
  description: 'Financial management for Safety Bay Tennis Club',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <TopNav />
        <main className="max-w-[1240px] mx-auto px-7 py-7">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify dev server starts cleanly**

```bash
npm run dev
```

Expected: server starts, http://localhost:3000 shows dark navy nav with "SBTC Treasury" and 3 tab links. Page background is `#f2f5f8`. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: replace sidebar layout with TopNav, load DM Sans/Mono fonts"
```

---

## Task 5: Financial Data Layer — PERIODS Map

**Files:**
- Modify: `src/lib/financialData.ts`
- Modify: `src/lib/__tests__/financialData.test.ts`

This adds a `source` field to `Transaction`, a `PERIODS` lookup map, and a helper to get ordered period keys.

- [ ] **Step 1: Write failing tests**

Add to `src/lib/__tests__/financialData.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  PERIODS,
  PERIOD_LABELS,
  LATEST_PERIOD_KEY,
  getOrderedPeriodKeys,
  JAN_2026,
  DEC_2025,
} from '@/lib/financialData'

describe('PERIODS map', () => {
  it('contains dec-2025 and jan-2026', () => {
    expect(PERIODS['dec-2025']).toBeDefined()
    expect(PERIODS['jan-2026']).toBeDefined()
  })

  it('LATEST_PERIOD_KEY is jan-2026', () => {
    expect(LATEST_PERIOD_KEY).toBe('jan-2026')
  })

  it('PERIOD_LABELS has human-readable names', () => {
    expect(PERIOD_LABELS['dec-2025']).toBe('December 2025')
    expect(PERIOD_LABELS['jan-2026']).toBe('January 2026')
  })

  it('getOrderedPeriodKeys returns keys in reverse chronological order', () => {
    const keys = getOrderedPeriodKeys()
    expect(keys[0]).toBe('jan-2026')
    expect(keys[1]).toBe('dec-2025')
  })

  it('full-year resolves to JAN_2026', () => {
    const period = PERIODS[LATEST_PERIOD_KEY]
    expect(period).toBe(JAN_2026)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: 5 new failures — `PERIODS`, `PERIOD_LABELS`, `LATEST_PERIOD_KEY`, `getOrderedPeriodKeys` not found.

- [ ] **Step 3: Add source field to Transaction and add PERIODS exports**

At the top of `src/lib/financialData.ts`, update the `Transaction` interface by adding an optional `source` field:

```ts
export interface Transaction {
  date: string
  description: string
  debit: number
  credit: number
  amount: number
  reference: string
  accountCode?: string
  confidence?: 'high' | 'medium' | 'low'
  status: 'pending' | 'confirmed' | 'skipped'
  source?: 'reckon' | 'square' | 'stripe'
}
```

At the bottom of `src/lib/financialData.ts`, after the `JAN_2026` export, add:

```ts
// ─── Period registry ─────────────────────────────────────────────────────────
// Add a new entry here each month after exporting from Reckon.
// Keys format: 'mmm-yyyy' lowercase, e.g. 'feb-2026'
// Values are YTD FinancialPeriod snapshots (1 March 2025 → end of month).

export const PERIODS: Record<string, FinancialPeriod> = {
  'jan-2026': JAN_2026,
  'dec-2025': DEC_2025,
}

export const PERIOD_LABELS: Record<string, string> = {
  'jan-2026': 'January 2026',
  'dec-2025': 'December 2025',
}

/** The most recent period key — used as the "Full Year" default. */
export const LATEST_PERIOD_KEY = 'jan-2026'

/**
 * Returns period keys ordered most-recent first (for the dropdown).
 * Add entries to PERIODS above; this function needs no changes.
 */
export function getOrderedPeriodKeys(): string[] {
  // Month order within the FY (Mar=0 … Feb=11)
  const FY_ORDER: Record<string, number> = {
    mar: 0, apr: 1, may: 2, jun: 3, jul: 4, aug: 5,
    sep: 6, oct: 7, nov: 8, dec: 9, jan: 10, feb: 11,
  }
  return Object.keys(PERIODS).sort((a, b) => {
    const [aM, aY] = a.split('-')
    const [bM, bY] = b.split('-')
    const yearDiff = Number(bY) - Number(aY)
    if (yearDiff !== 0) return yearDiff
    return (FY_ORDER[bM] ?? 0) - (FY_ORDER[aM] ?? 0)
  })
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass including the 5 new ones.

- [ ] **Step 5: Commit**

```bash
git add src/lib/financialData.ts src/lib/__tests__/financialData.test.ts
git commit -m "feat: add PERIODS map and getOrderedPeriodKeys to financialData"
```

---

## Task 6: Dashboard — KPI Cards

**Files:**
- Create: `src/components/dashboard/KpiCards.tsx`

- [ ] **Step 1: Create KpiCards.tsx**

```tsx
import type { FinancialPeriod } from '@/lib/financialData'
import { getTotalIncome, getTotalExpenses, getNetPosition, getTotalCOGS } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
}

interface KpiCardProps {
  label: string
  value: number
  positive?: boolean   // if true, colour green; if false, colour red
  neutral?: boolean    // no colour tint (grey)
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function KpiCard({ label, value, positive, neutral }: KpiCardProps) {
  const colour = neutral ? 'var(--text-1)' : value >= 0 && positive !== false ? 'var(--green)' : 'var(--red)'
  return (
    <div className="card flex flex-col gap-2">
      <span className="section-label">{label}</span>
      <span
        className="font-mono text-[34px] font-medium leading-none"
        style={{ color: colour, fontFamily: 'var(--font-mono)' }}
      >
        {fmt(value)}
      </span>
    </div>
  )
}

export default function KpiCards({ period }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      <KpiCard label="Total Income"    value={getTotalIncome(period)}    positive />
      <KpiCard label="Total Expenses"  value={getTotalExpenses(period)}  neutral />
      <KpiCard label="Net Position"    value={getNetPosition(period)}    />
      <KpiCard label="COGS — Drinks"   value={getTotalCOGS(period)}      neutral />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/KpiCards.tsx
git commit -m "feat: add KpiCards dashboard component"
```

---

## Task 7: Dashboard — Bank Balances

**Files:**
- Create: `src/components/dashboard/BankBalances.tsx`

- [ ] **Step 1: Create BankBalances.tsx**

```tsx
import type { FinancialPeriod } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n)
}

// Map balance sheet account names to display config
const OPERATING = [
  'Bank - Trading Account',
  'Bank - Cards Petty Cash',
]
const SAVINGS = [
  'Bank - Asset Renewal Account',
  'Bank - Building Fund',
  'Bank - Asset Renewal Term Deposit',
  'Building Fundraiser Term Deposit',
]

function BankRow({ name, amount }: { name: string; amount: number }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{name}</span>
      <span className="font-mono font-medium" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
        {fmt(amount)}
      </span>
    </div>
  )
}

export default function BankBalances({ period }: Props) {
  const bs = period.balanceSheet

  function getAmount(name: string) {
    return bs.find(l => l.name === name)?.amount ?? 0
  }

  const operatingTotal = OPERATING.reduce((s, n) => s + getAmount(n), 0)
  const savingsTotal   = SAVINGS.reduce((s, n) => s + getAmount(n), 0)

  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--text-1)' }}>Bank Balances</h2>

      <div className="mb-4">
        <p className="section-label mb-1">Operating</p>
        {OPERATING.map(name => <BankRow key={name} name={name.replace('Bank - ', '')} amount={getAmount(name)} />)}
        <div className="flex justify-between pt-2">
          <span className="section-label">Total Operating</span>
          <span className="font-mono font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(operatingTotal)}</span>
        </div>
      </div>

      <div>
        <p className="section-label mb-1">Savings &amp; Investments</p>
        {SAVINGS.map(name => <BankRow key={name} name={name.replace('Bank - ', '')} amount={getAmount(name)} />)}
        <div className="flex justify-between pt-2">
          <span className="section-label">Total Savings</span>
          <span className="font-mono font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(savingsTotal)}</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/BankBalances.tsx
git commit -m "feat: add BankBalances dashboard component"
```

---

## Task 8: Dashboard — Charts

**Files:**
- Create: `src/components/dashboard/CategoryBarChart.tsx`
- Create: `src/components/dashboard/CategoryPieChart.tsx`
- Create: `src/components/dashboard/MonthlyTrendChart.tsx`

- [ ] **Step 1: Create CategoryBarChart.tsx**

Renders a horizontal bar chart of the top N income or expense categories from a period's `pnl` array.

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { FinancialPeriod } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
  mode: 'income' | 'expense'
  topN?: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export default function CategoryBarChart({ period, mode, topN = 8 }: Props) {
  const data = period.pnl
    .map(cat => ({ name: cat.name, value: mode === 'income' ? cat.income : cat.expenses }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, topN)

  const colour = mode === 'income' ? '#1D9E75' : '#1e3a5f'

  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-2)' }}>
        {mode === 'income' ? 'Income by Category' : 'Expenses by Category'}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colour} fillOpacity={1 - i * 0.08} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Create CategoryPieChart.tsx**

```tsx
'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { FinancialPeriod } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
  mode: 'income' | 'expense'
}

const COLOURS = ['#1D9E75','#1e3a5f','#2563eb','#d97706','#7c3aed','#db2777','#059669','#0891b2']

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export default function CategoryPieChart({ period, mode }: Props) {
  const data = period.pnl
    .map(cat => ({ name: cat.name, value: mode === 'income' ? cat.income : cat.expenses }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-2)' }}>
        {mode === 'income' ? 'Income Split' : 'Expense Split'}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => <Cell key={i} fill={COLOURS[i % COLOURS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create MonthlyTrendChart.tsx**

Shown only when "Full Year" is selected. Plots available months' net positions.

```tsx
'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { PERIODS, PERIOD_LABELS, getOrderedPeriodKeys, getNetPosition } from '@/lib/financialData'

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export default function MonthlyTrendChart() {
  // Build data from all available periods, oldest first
  const keys = getOrderedPeriodKeys().reverse()
  const data = keys.map(key => ({
    month: PERIOD_LABELS[key] ?? key,
    netPosition: getNetPosition(PERIODS[key]),
  }))

  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-2)' }}>
        YTD Net Position — Monthly
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Line type="monotone" dataKey="netPosition" stroke="#1D9E75" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/CategoryBarChart.tsx src/components/dashboard/CategoryPieChart.tsx src/components/dashboard/MonthlyTrendChart.tsx
git commit -m "feat: add CategoryBarChart, CategoryPieChart, MonthlyTrendChart"
```

---

## Task 9: Dashboard — Supporting Components

**Files:**
- Create: `src/components/dashboard/PeriodSelector.tsx`
- Create: `src/components/dashboard/QuickActions.tsx`
- Create: `src/components/dashboard/AiChatPlaceholder.tsx`

- [ ] **Step 1: Create PeriodSelector.tsx**

```tsx
'use client'

import { getOrderedPeriodKeys, PERIOD_LABELS, LATEST_PERIOD_KEY } from '@/lib/financialData'

interface Props {
  value: string
  onChange: (key: string) => void
}

export default function PeriodSelector({ value, onChange }: Props) {
  const keys = getOrderedPeriodKeys()

  return (
    <div className="flex items-center gap-3">
      <label className="section-label">Period</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field"
        style={{ width: 'auto', minWidth: '200px' }}
      >
        <option value="full-year">Full Year 2025-26</option>
        {keys.map(key => (
          <option key={key} value={key}>{PERIOD_LABELS[key] ?? key}</option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 2: Create QuickActions.tsx**

```tsx
import Link from 'next/link'

export default function QuickActions() {
  return (
    <div className="card flex gap-3 items-center">
      <span className="section-label mr-2">Quick Actions</span>
      <Link href="/transactions" className="btn-primary">
        Go to Allocation →
      </Link>
      <Link href="/reports" className="btn-secondary">
        View Reports →
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Create AiChatPlaceholder.tsx**

```tsx
'use client'

import { useState } from 'react'

const PROMPTS = [
  'What was our biggest expense this month?',
  'How do drink sales compare to last month?',
  'What is our current net position?',
  'Which cost centres are over budget?',
]

export default function AiChatPlaceholder() {
  const [input, setInput] = useState('')

  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>AI Assistant</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
        Ask questions about your finances — coming soon.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a question…"
          className="input-field flex-1"
          disabled
        />
        <button className="btn-primary opacity-50 cursor-not-allowed" disabled>Ask</button>
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
        AI chat will be wired to Claude API in a future update.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/PeriodSelector.tsx src/components/dashboard/QuickActions.tsx src/components/dashboard/AiChatPlaceholder.tsx
git commit -m "feat: add PeriodSelector, QuickActions, AiChatPlaceholder"
```

---

## Task 10: Wire Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite src/app/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { PERIODS, LATEST_PERIOD_KEY } from '@/lib/financialData'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import KpiCards from '@/components/dashboard/KpiCards'
import BankBalances from '@/components/dashboard/BankBalances'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import QuickActions from '@/components/dashboard/QuickActions'
import AiChatPlaceholder from '@/components/dashboard/AiChatPlaceholder'

export default function DashboardPage() {
  const [periodKey, setPeriodKey] = useState<string>('full-year')

  const resolvedKey = periodKey === 'full-year' ? LATEST_PERIOD_KEY : periodKey
  const period = PERIODS[resolvedKey]

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

      {/* KPI row */}
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

- [ ] **Step 2: Check dashboard in browser**

```bash
npm run dev
```

Open http://localhost:3000. Expected: Dashboard with period selector, 4 KPI cards, 4 charts, bank balances, quick action buttons, AI chat placeholder. Switching period selector updates all figures.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build Dashboard page with period selector and charts"
```

---

## Task 11: CSV Parser Extensions

**Files:**
- Modify: `src/lib/csvParser.ts`
- Modify: `src/lib/__tests__/csvParser.test.ts`

Adds Square POS and Stripe CSV parsers plus a `detectCsvSource` function.

- [ ] **Step 1: Write failing tests**

Add to `src/lib/__tests__/csvParser.test.ts`:

```ts
import { detectCsvSource, parseSquareCsv, parseStripeCsv } from '@/lib/csvParser'

describe('detectCsvSource', () => {
  it('detects Reckon by Debit/Credit headers', () => {
    const csv = 'Date,Description,Reference,Debit,Credit,Balance\n'
    expect(detectCsvSource(csv)).toBe('reckon')
  })

  it('detects Square by Category/Net Sales headers', () => {
    const csv = 'Date,Time,Time Zone,Category,Item,Qty,Price Point Name,SKU,Modifiers Applied,Gross Sales,Discounts,Net Sales,Tax,Transaction ID\n'
    expect(detectCsvSource(csv)).toBe('square')
  })

  it('detects Stripe by Created (UTC)/Seller Message headers', () => {
    const csv = 'id,Description,Seller Message,Created (UTC),Amount,Amount Refunded,Currency,Status\n'
    expect(detectCsvSource(csv)).toBe('stripe')
  })

  it('returns unknown for unrecognised format', () => {
    const csv = 'foo,bar,baz\n'
    expect(detectCsvSource(csv)).toBe('unknown')
  })
})

describe('parseSquareCsv', () => {
  const squareCsv = `Date,Time,Time Zone,Category,Item,Qty,Price Point Name,SKU,Modifiers Applied,Gross Sales,Discounts,Net Sales,Tax,Transaction ID
2025-12-01,09:00,AWST,Drinks,Beer,1,Pint,,, $5.50,$0.00,$5.50,$0.00,ABC123
2025-12-01,09:05,AWST,Social Tennis,Friday Social,1,Day Fee,,, $5.00,$0.00,$5.00,$0.00,ABC124
`

  it('parses rows into transactions', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns).toHaveLength(2)
  })

  it('maps date from YYYY-MM-DD to DD/MM/YYYY', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].date).toBe('01/12/2025')
  })

  it('sets positive amount from Net Sales', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].amount).toBeCloseTo(5.50)
  })

  it('sets source to square', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].source).toBe('square')
  })

  it('sets description to Category — Item', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].description).toBe('Drinks — Beer')
  })
})

describe('parseStripeCsv', () => {
  const stripeCsv = `id,Description,Seller Message,Created (UTC),Amount,Amount Refunded,Currency,Status
py_abc,Court Hire — Booking #1234,Payment complete,2025-12-05 14:30,45.00,0.00,AUD,Paid
py_xyz,Membership — Adult,Payment complete,2025-12-06 09:15,180.00,0.00,AUD,Paid
`

  it('parses rows into transactions', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns).toHaveLength(2)
  })

  it('maps Created (UTC) date to DD/MM/YYYY', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns[0].date).toBe('05/12/2025')
  })

  it('sets positive amount', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns[0].amount).toBeCloseTo(45.00)
  })

  it('sets source to stripe', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns[0].source).toBe('stripe')
  })

  it('skips non-Paid rows', () => {
    const csv = `id,Description,Seller Message,Created (UTC),Amount,Amount Refunded,Currency,Status
py_fail,Test,fail,2025-12-05 10:00,10.00,0.00,AUD,Failed
`
    expect(parseStripeCsv(csv)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — verify failures**

```bash
npm test
```

Expected: 12 new failures for `detectCsvSource`, `parseSquareCsv`, `parseStripeCsv` not found.

- [ ] **Step 3: Implement in csvParser.ts**

Add to the bottom of `src/lib/csvParser.ts` (keep existing `parseReckonCsv` and `serialiseToReckonCsv` unchanged):

```ts
// ─── CSV source detection ─────────────────────────────────────────────────────

export type CsvSource = 'reckon' | 'square' | 'stripe' | 'unknown'

export function detectCsvSource(csvText: string): CsvSource {
  const header = csvText.split('\n')[0].toLowerCase()
  if (header.includes('debit') && header.includes('credit')) return 'reckon'
  if (header.includes('net sales') && header.includes('category')) return 'square'
  if (header.includes('created (utc)') && header.includes('seller message')) return 'stripe'
  return 'unknown'
}

// ─── Square POS parser ───────────────────────────────────────────────────────
// Expects the "Items" CSV export from Square Dashboard → Reports → Item Sales.
// Key columns: Date (YYYY-MM-DD), Category, Item, Net Sales, Transaction ID

export function parseSquareCsv(csvText: string): Transaction[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  const iDate     = idx('date')
  const iCat      = idx('category')
  const iItem     = idx('item')
  const iNetSales = idx('net sales')
  const iTxnId    = idx('transaction id')

  return lines.slice(1).flatMap(line => {
    const cols = splitCsvLine(line)
    if (cols.length < 4) return []

    const netSalesRaw = (cols[iNetSales] ?? '').replace(/[$,\s]/g, '')
    const netSales = parseFloat(netSalesRaw)
    if (isNaN(netSales) || netSales === 0) return []

    const rawDate = (cols[iDate] ?? '').trim()                    // YYYY-MM-DD
    const [y, m, d] = rawDate.split('-')
    const date = `${d}/${m}/${y}`                                  // DD/MM/YYYY

    const category = (cols[iCat] ?? '').trim()
    const item     = (cols[iItem] ?? '').trim()
    const description = `${category} — ${item}`
    const reference   = (cols[iTxnId] ?? '').trim()

    return [{
      date,
      description,
      debit: 0,
      credit: netSales,
      amount: netSales,
      reference,
      status: 'pending' as const,
      source: 'square' as const,
    }]
  })
}

// ─── Stripe parser ────────────────────────────────────────────────────────────
// Expects the "Payments" CSV export from Stripe Dashboard → Reports → Payments.
// Key columns: id, Description, Created (UTC), Amount, Status

export function parseStripeCsv(csvText: string): Transaction[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  const iId      = idx('id')
  const iDesc    = idx('description')
  const iDate    = idx('created (utc)')
  const iAmount  = idx('amount')
  const iStatus  = idx('status')

  return lines.slice(1).flatMap(line => {
    const cols = splitCsvLine(line)
    if (cols.length < 4) return []

    const status = (cols[iStatus] ?? '').trim()
    if (status.toLowerCase() !== 'paid') return []

    const amountRaw = (cols[iAmount] ?? '').replace(/[$,\s]/g, '')
    const amount = parseFloat(amountRaw)
    if (isNaN(amount)) return []

    const rawDate = (cols[iDate] ?? '').trim().split(' ')[0]   // YYYY-MM-DD
    const [y, m, d] = rawDate.split('-')
    const date = `${d}/${m}/${y}`

    const description = (cols[iDesc] ?? '').trim()
    const reference   = (cols[iId] ?? '').trim()

    return [{
      date,
      description,
      debit: 0,
      credit: amount,
      amount,
      reference,
      status: 'pending' as const,
      source: 'stripe' as const,
    }]
  })
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
    current += ch
  }
  result.push(current.trim())
  return result
}
```

Also update the existing `parseReckonCsv` function to set `source: 'reckon'` on each returned transaction. Find the `return {` line inside `parseReckonCsv` and add `source: 'reckon' as const` to the returned object.

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/csvParser.ts src/lib/__tests__/csvParser.test.ts
git commit -m "feat: add Square/Stripe CSV parsers and detectCsvSource"
```

---

## Task 12: Allocation — CSV Upload Update

**Files:**
- Modify: `src/components/transactions/CsvUpload.tsx`

- [ ] **Step 1: Rewrite CsvUpload.tsx to detect source and call correct parser**

```tsx
'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import type { Transaction } from '@/lib/financialData'
import { parseReckonCsv, parseSquareCsv, parseStripeCsv, detectCsvSource } from '@/lib/csvParser'

interface Props {
  onLoaded: (transactions: Transaction[], source: 'reckon' | 'square' | 'stripe') => void
}

const SOURCE_LABEL: Record<string, string> = {
  reckon: 'Reckon bank export',
  square: 'Square POS export',
  stripe: 'Stripe payments export',
}

const SOURCE_HINT: Record<string, string> = {
  reckon: 'Reckon → Reports → Transaction Reports → All Transactions → Export CSV',
  square: 'Square → Reports → Item Sales → Export CSV',
  stripe: 'Stripe → Payments → Export → CSV',
}

export function CsvUpload({ onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const source = detectCsvSource(text)

      if (source === 'unknown') {
        alert('Unrecognised CSV format. Expected a Reckon, Square, or Stripe export.')
        return
      }

      const parsers = { reckon: parseReckonCsv, square: parseSquareCsv, stripe: parseStripeCsv }
      const transactions = parsers[source](text)
      onLoaded(transactions, source)
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div
      className="card text-center cursor-pointer transition-colors"
      style={{ border: '2px dashed var(--border)' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <Upload className="mx-auto mb-3" size={36} style={{ color: 'var(--text-3)' }} />
      <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>
        Upload CSV
      </p>
      <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>
        Accepts: Reckon bank export · Square POS · Stripe payments
      </p>
      <div className="flex justify-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
        {Object.entries(SOURCE_HINT).map(([src, hint]) => (
          <span key={src}>
            <strong>{SOURCE_LABEL[src]}:</strong> {hint}
          </span>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>Drag and drop or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/transactions/CsvUpload.tsx
git commit -m "feat: update CsvUpload to detect and route Square/Stripe/Reckon CSVs"
```

---

## Task 13: Allocation — ReviewTable Update

**Files:**
- Modify: `src/components/transactions/ReviewTable.tsx`

Add a Source column and a "Accept All AI Proposals" bulk button. Keep all existing logic untouched.

- [ ] **Step 1: Add Source column header**

Find the `<thead>` block and add a Source `<th>` after the Amount column:

```tsx
<th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Source</th>
```

The full updated `<thead>`:

```tsx
<thead style={{ background: 'var(--bg)' }}>
  <tr>
    <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Date</th>
    <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Description</th>
    <th className="px-4 py-3 text-right font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Amount</th>
    <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Source</th>
    <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Proposed Account</th>
    <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Actions</th>
  </tr>
</thead>
```

- [ ] **Step 2: Add Source cell in tbody rows**

In the `<tbody>`, after the Amount `<td>`, add:

```tsx
<td className="px-4 py-3 whitespace-nowrap">
  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
    background: t.source === 'square' ? 'rgba(29,158,117,0.1)' :
                t.source === 'stripe' ? 'rgba(30,58,95,0.1)' : 'rgba(107,114,128,0.1)',
    color: t.source === 'square' ? 'var(--brand)' :
           t.source === 'stripe' ? 'var(--nav)' : 'var(--text-3)',
  }}>
    {t.source ?? 'reckon'}
  </span>
</td>
```

- [ ] **Step 3: Add bulk accept button above the table**

Add an `acceptAll` callback and button. In the component body, add after the existing callbacks:

```tsx
const acceptAll = useCallback(() => {
  const updated = transactions.map((t, i) => {
    if (t.status !== 'pending') return t
    const sug = suggestions[i]
    if (!sug?.code || sug.loading) return t
    setCachedSuggestion(t.description, sug.code, sug.name)
    return { ...t, accountCode: sug.code, status: 'confirmed' as const, confidence: sug.confidence }
  })
  onChange(updated)
}, [suggestions, transactions, onChange])

const pendingWithSuggestion = transactions.filter((t, i) =>
  t.status === 'pending' && suggestions[i]?.code && !suggestions[i]?.loading
).length
```

Wrap the returned JSX in a `<div className="space-y-3">` and add a header row before the table:

```tsx
<div className="flex justify-between items-center">
  <p className="text-sm" style={{ color: 'var(--text-2)' }}>
    {transactions.length} transactions
  </p>
  {pendingWithSuggestion > 0 && (
    <button onClick={acceptAll} className="btn-primary text-sm">
      Accept All AI Proposals ({pendingWithSuggestion})
    </button>
  )}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/transactions/ReviewTable.tsx
git commit -m "feat: add Source column and bulk accept to ReviewTable"
```

---

## Task 14: Allocation — Reconciliation Gate

**Files:**
- Create: `src/components/allocation/ReconciliationGate.tsx`

- [ ] **Step 1: Create ReconciliationGate.tsx**

```tsx
'use client'

import { useState } from 'react'
import type { Transaction } from '@/lib/financialData'
import { accounts } from '@/lib/accounts'

interface Props {
  transactions: Transaction[]
  onConfirm: () => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n)
}

export default function ReconciliationGate({ transactions, onConfirm }: Props) {
  const [open, setOpen] = useState(false)

  const confirmed = transactions.filter(t => t.status === 'confirmed')
  const skipped   = transactions.filter(t => t.status === 'skipped')
  const pending   = transactions.filter(t => t.status === 'pending')
  const allDone   = pending.length === 0

  // Group confirmed by account code
  const byCode = confirmed.reduce<Record<string, { name: string; total: number }>>((acc, t) => {
    const code = t.accountCode ?? 'unassigned'
    const name = accounts.find(a => a.code === code)?.name ?? code
    if (!acc[code]) acc[code] = { name, total: 0 }
    acc[code].total += t.amount
    return acc
  }, {})

  const grandTotal = confirmed.reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <div className="card flex items-center justify-between">
        <div className="text-sm" style={{ color: 'var(--text-2)' }}>
          {confirmed.length} confirmed · {skipped.length} skipped · {pending.length} pending
        </div>
        <button
          className="btn-primary"
          disabled={!allDone}
          onClick={() => setOpen(true)}
          title={!allDone ? `${pending.length} transactions still pending review` : undefined}
        >
          Reconcile &amp; Push to Reckon
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-1)' }}>
              Confirm Reconciliation
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
              You are about to push <strong>{confirmed.length} transactions</strong> to Reckon One.
              {skipped.length > 0 && ` ${skipped.length} skipped transactions will not be affected.`}
            </p>

            {/* Breakdown */}
            <div className="mb-4">
              <p className="section-label mb-2">Breakdown by Account</p>
              {Object.entries(byCode).map(([code, { name, total }]) => (
                <div key={code} className="flex justify-between py-1.5 border-b text-sm" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--text-2)' }}>{code} {name}</span>
                  <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: total >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {fmt(total)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-semibold text-sm">
                <span>Total</span>
                <span className="font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(grandTotal)}</span>
              </div>
            </div>

            <div className="text-sm p-3 rounded-lg mb-4" style={{ background: 'rgba(180,83,9,0.08)', color: 'var(--amber)' }}>
              ⚠️ This will export a CSV for import into Reckon One. Review the file before importing.
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => { setOpen(false); onConfirm() }}>
                Confirm &amp; Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/allocation/ReconciliationGate.tsx
git commit -m "feat: add ReconciliationGate with confirmation modal"
```

---

## Task 15: Wire Allocation Page

**Files:**
- Modify: `src/app/transactions/page.tsx`

- [ ] **Step 1: Rewrite transactions/page.tsx**

```tsx
'use client'

import { useState } from 'react'
import { CsvUpload } from '@/components/transactions/CsvUpload'
import { ReviewTable } from '@/components/transactions/ReviewTable'
import { ProgressBar } from '@/components/transactions/ProgressBar'
import { ExportButton } from '@/components/transactions/ExportButton'
import ReconciliationGate from '@/components/allocation/ReconciliationGate'
import type { Transaction } from '@/lib/financialData'
import type { CsvSource } from '@/lib/csvParser'
import { serialiseToReckonCsv } from '@/lib/csvParser'

export default function AllocationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [source, setSource] = useState<CsvSource | null>(null)

  function handleLoaded(txns: Transaction[], src: CsvSource) {
    setTransactions(txns)
    setSource(src)
  }

  function handleExport() {
    const csv = serialiseToReckonCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sbtc-reconciled-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Upload a CSV from Reckon, Square POS, or Stripe to begin allocating transactions.
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
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButton transactions={transactions} />
          <button onClick={() => { setTransactions([]); setSource(null) }} className="btn-secondary text-sm">
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

> **Note:** `ExportButton` needs an `id` prop adding. Open `src/components/transactions/ExportButton.tsx` and add `id?: string` to its props interface, then spread it onto the `<button>` element.

- [ ] **Step 2: Update categoriser prompt with allocation rules**

Open `src/lib/server/categoriser.ts`. Replace the prompt content block with:

```ts
content: `You are a bookkeeper for Safety Bay Tennis Club (SBTC), Perth WA.

KNOWN MERCHANT MAPPINGS (use these first before guessing):
- BWS / Big Brews → 5-1000 COGS: Drinks
- Karen Wenham → 6-1201 Cleaning Honorarium
- Shane Fox / Fox Tennis Academy → 6-5005 Coaching Kidsport
- Jims Mowing / Barra's Mowing → 6-1403 Grounds: Repairs & Maintenance
- Elders Insurance → 6-7003 Insurance
- Pentanet → 6-1211 Internet Connection
- Reckon Ltd → 6-7099 Computer Software
- Synergy BPAY → 6-1212 Electricity
- City of Rockingham BPAY → 6-1210 Rates, ESL, Waste
- Tennis West → 6-1602 Pennants: Tennis West Fees
- WA Return Recycle Renew → 4-9000 Other Income
- DEPOSIT ROCKINGHAM CITY / Cash Income → 4-4011 Drink Sales (cash)
- Shane Fox INV (coaching rent) → 4-5001 Coaching Rent Income

SQUARE POS categories map to:
- Drinks → 4-4011 Drink Sales
- Monday Social → 4-0201, Wednesday → 4-0202, Thursday → 4-0203
- Friday → 4-0205, Friday Night → 4-0206, Sunday → 4-0207

Transaction:
- Description: ${description}
- Amount: $${Math.abs(amount).toFixed(2)} (${amount >= 0 ? 'credit/income' : 'debit/expense'})

Chart of accounts:
${accountList}

Reply with ONLY a JSON object (no markdown):
{"code": "6-1402", "name": "Grounds - Consumables", "confidence": "high"}

Confidence: "high" = clear match, "medium" = likely match, "low" = unclear`,
```

- [ ] **Step 4: Verify Allocation tab in browser**

```bash
npm run dev
```

Open http://localhost:3000/transactions. Expected: upload zone visible. Upload a Reckon CSV — table populates with Source = "reckon" pills, AI suggestions load, confirm/skip/edit work, Reconcile button disabled until all rows done, clicking it shows modal with breakdown.

- [ ] **Step 5: Commit**

```bash
git add src/app/transactions/page.tsx src/components/transactions/ExportButton.tsx src/lib/server/categoriser.ts
git commit -m "feat: build Allocation page with source detection, bulk accept, and reconciliation gate"
```

---

## Task 16: Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`
- Modify: `src/components/settings/ReckonIntegration.tsx`

- [ ] **Step 1: Rewrite src/app/settings/page.tsx**

```tsx
import ReckonIntegration from '@/components/settings/ReckonIntegration'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Settings</h1>
      <ReckonIntegration />
      <DisabledSection
        title="Square POS"
        description="Square API integration coming soon. Use CSV upload on the Allocation tab for now."
      />
      <DisabledSection
        title="Stripe"
        description="Stripe API integration coming soon. Use CSV upload on the Allocation tab for now."
      />
      <BankMappings />
    </div>
  )
}

function DisabledSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="card opacity-60">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
          Coming soon
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>{description}</p>
    </div>
  )
}

const BANK_ACCOUNTS = [
  { name: 'Bank - Trading Account',           defaultCode: '1-1001' },
  { name: 'Bank - Cards Petty Cash Account',  defaultCode: '1-1002' },
  { name: 'Bank - Asset Renewal Account',     defaultCode: '1-1003' },
  { name: 'Bank - Asset Renewal Term Deposit',defaultCode: '1-1004' },
]

function BankMappings() {
  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>Bank Account Mappings</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
        Map each bank account to its Reckon account code. Saved to browser localStorage.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left pb-2 section-label">Account</th>
            <th className="text-left pb-2 section-label">Reckon Code</th>
          </tr>
        </thead>
        <tbody>
          {BANK_ACCOUNTS.map(acct => (
            <tr key={acct.name} className="border-t" style={{ borderColor: 'var(--border)' }}>
              <td className="py-2 pr-4" style={{ color: 'var(--text-2)' }}>{acct.name}</td>
              <td className="py-2">
                <input
                  type="text"
                  defaultValue={acct.defaultCode}
                  className="input-field"
                  style={{ width: '120px' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
        Note: Bank mapping persistence via localStorage will be added in a follow-up.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Strip down ReckonIntegration.tsx to essentials**

Open `src/components/settings/ReckonIntegration.tsx`. Replace all contents with:

```tsx
'use client'

import { useState, useEffect } from 'react'

const LS_KEY = 'sbtc_reckon_config'

interface ReckonConfig {
  apiKey: string
  bookId: string
}

function loadConfig(): ReckonConfig {
  if (typeof window === 'undefined') return { apiKey: '', bookId: '' }
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
  } catch { return { apiKey: '', bookId: '' } }
}

export default function ReckonIntegration() {
  const [config, setConfig] = useState<ReckonConfig>({ apiKey: '', bookId: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => { setConfig(loadConfig()) }, [])

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
        API credentials for future direct integration. Not used yet — CSV export is the current workflow.
      </p>
      <div className="space-y-3">
        <div>
          <label className="section-label block mb-1">API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
            placeholder="Enter Reckon API key"
            className="input-field"
          />
        </div>
        <div>
          <label className="section-label block mb-1">Book ID</label>
          <input
            type="text"
            value={config.bookId}
            onChange={e => setConfig(c => ({ ...c, bookId: e.target.value }))}
            placeholder="7f71d29b-8720-422d-8382-d961bb783990"
            className="input-field"
          />
        </div>
        <button onClick={save} className="btn-primary">
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/settings/page.tsx src/components/settings/ReckonIntegration.tsx
git commit -m "feat: build Settings page with Reckon config, placeholders, bank mappings"
```

---

## Task 17: Restyle Reports

**Files:**
- Modify: `src/components/reports/PLReport.tsx`
- Modify: `src/components/reports/BalanceSheetReport.tsx`
- Modify: `src/components/reports/DrinksReport.tsx`
- Modify: `src/components/reports/FinancialReports.tsx`

The goal is to replace hardcoded Tailwind colours and `className="card"` with the CSS variable tokens. No logic changes.

- [ ] **Step 1: Update PLReport.tsx — replace styling**

Open `src/components/reports/PLReport.tsx`. Make these replacements throughout the file:

- `className="card"` → keep as-is (`.card` now uses CSS variables)
- Any `text-gray-*` → `style={{ color: 'var(--text-2)' }}` or `style={{ color: 'var(--text-3)' }}`
- Any `text-green-*` → `style={{ color: 'var(--green)' }}`
- Any `text-red-*` → `style={{ color: 'var(--red)' }}`
- Any `font-mono` → add `style={{ fontFamily: 'var(--font-mono)' }}`
- Any `bg-gray-50` on table headers → `style={{ background: 'var(--bg)' }}`
- Any `border-gray-*` → `style={{ borderColor: 'var(--border)' }}`

Apply the same replacements to `BalanceSheetReport.tsx` and `DrinksReport.tsx`.

- [ ] **Step 2: Update FinancialReports.tsx to use brand styling**

Open `src/components/reports/FinancialReports.tsx`. Replace any heading `text-gray-900` with `style={{ color: 'var(--text-1)' }}`. Replace `btn-primary` and `btn-secondary` class usages — they already use CSS variables after Task 2, so no change needed.

- [ ] **Step 3: Commit**

```bash
git add src/components/reports/
git commit -m "style: restyle report components to use CSS variable tokens"
```

---

## Task 18: Build Check and Final Fixes

**Files:** Whatever the build errors reveal.

- [ ] **Step 1: Run production build**

```bash
npm run build
```

- [ ] **Step 2: Fix any TypeScript errors**

Common issues to watch for:
- `Transaction.source` is optional — check that existing code treating `source` as required is updated
- Recharts types: if `Cell` import causes issues, add `// @ts-ignore` above the `Cell` usage
- `serialiseToReckonCsv` import: confirm it is exported from `csvParser.ts` (it is)

Fix each error, then re-run `npm run build` until it passes with no errors.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests pass. If a test fails due to the `source` field added to `Transaction`, update the test fixture to include `source: 'reckon'`.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve build errors from dashboard rebuild"
```

---

## Done

Deliverables:
- TopNav replaces sidebar — Dashboard, Allocation, Settings tabs
- Dashboard: period selector, 4 KPI cards, 4 charts, bank balances, quick actions, AI placeholder
- Allocation: CSV upload (Reckon/Square/Stripe), AI review table with source column + bulk accept, reconciliation gate + modal
- Settings: Reckon config, disabled Square/Stripe stubs, bank mappings
- Reports: restyled to match brand tokens
- All existing tests pass, build clean
