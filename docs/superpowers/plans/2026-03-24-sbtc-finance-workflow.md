# SBTC Finance Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monthly transaction categorisation and report generation workflow for Safety Bay Tennis Club, replacing placeholder data with real Jan 2026 actuals and enabling CSV-based Reckon integration with AI cost-centre suggestions.

**Architecture:** Four parallel tracks (A: data foundation, B: transaction categorisation, C: report generation, D: infrastructure) with tracks A+D running first, then B+C in parallel, then integration. All state is localStorage + CSV in Phase 1 — no database.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Anthropic SDK (`@anthropic-ai/sdk`), Recharts (existing), Vitest (new)

**Spec:** `docs/superpowers/specs/2026-03-24-sbtc-finance-workflow-design.md`

---

## Multi-Agent Dispatch Guide

```
Phase 1 (parallel — no dependencies between A and D):
  Agent 1 → TRACK A: Tasks A0, A1, A2, A3, A4, A5
  Agent 2 → TRACK D: Tasks D1, D2

Phase 2 (parallel — both depend on Track A types being complete):
  Agent 3 → TRACK B: Tasks B1, B2, B3, B4, B5, B6
  Agent 4 → TRACK C: Tasks C1, C2, C3, C4

Phase 3 (sequential — integration):
  Agent 5 → TRACK I: Tasks I1, I2
```

Each track section below is self-contained — a fresh agent can start from the track heading with only the spec and the plan file as context.

---

## TRACK A — Data Foundation

**Prerequisite:** None. Start immediately.
**Produces:** `src/lib/financialData.ts` with Jan 2026 actuals + TypeScript types. Dashboard and Budget pages updated with real figures.
**Other tracks depend on:** The TypeScript interfaces exported from `financialData.ts`.

---

### Task A0: Set up test infrastructure

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

```bash
cd C:\Users\Rory\.openclaw\workspace\tennis-expense-tracker
npm install --save-dev vitest @vitest/ui
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify test runner works**

```bash
npm test
```
Expected: "No test files found" — that's fine, infrastructure is ready.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add Vitest test infrastructure"
```

---

### Task A1: Create financialData.ts with types and Jan 2026 actuals

**Files:**
- Create: `src/lib/financialData.ts`
- Create: `src/lib/__tests__/financialData.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/financialData.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { JAN_2026, getTotalIncome, getTotalExpenses, getNetPosition } from '@/lib/financialData'

describe('financialData', () => {
  it('total income matches P&L report', () => {
    expect(getTotalIncome(JAN_2026)).toBeCloseTo(105528.77, 2)
  })

  it('total expenses matches P&L report', () => {
    expect(getTotalExpenses(JAN_2026)).toBeCloseTo(63424.13, 2)
  })

  it('net position matches P&L report', () => {
    expect(getNetPosition(JAN_2026)).toBeCloseTo(37153.53, 2)
  })

  it('balance sheet total assets correct', () => {
    const totalAssets = JAN_2026.balanceSheet
      .filter(l => l.section === 'current_assets' || l.section === 'non_current_assets')
      .reduce((sum, l) => sum + l.amount, 0)
    expect(totalAssets).toBeCloseTo(242589.37, 2)
  })

  it('drinks POS gross profit percent is 37%', () => {
    expect(JAN_2026.drinksPOS.grossProfitPct).toBe(37)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```
Expected: FAIL — "Cannot find module '@/lib/financialData'"

- [ ] **Step 3: Create financialData.ts**

Create `src/lib/financialData.ts`:
```ts
// ─── Types ───────────────────────────────────────────────────────────────────

export interface Transaction {
  date: string          // DD/MM/YYYY
  description: string
  debit: number
  credit: number
  amount: number        // credit - debit (positive = income, negative = expense)
  reference: string
  accountCode?: string  // assigned cost centre code e.g. '6-1402'
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
  label: string     // e.g. "1 March 2025 to 31 January 2026"
  asAtDate: string  // e.g. "31 January 2026"
  pnl: PnLCategory[]
  balanceSheet: BalanceSheetLine[]
  drinksPOS: DrinksPOSData
}

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getTotalIncome(period: FinancialPeriod): number {
  return period.pnl.reduce((sum, c) => sum + c.income, 0)
}

export function getTotalExpenses(period: FinancialPeriod): number {
  return period.pnl.reduce((sum, c) => sum + c.expenses, 0)
}

export function getNetPosition(period: FinancialPeriod): number {
  return getTotalIncome(period) - getTotalExpenses(period)
}

// ─── Jan 2026 Actuals (YTD: 1 Mar 2025 – 31 Jan 2026) ───────────────────────
// Source: Reckon P&L reports exported 24 March 2026
// Balance Sheet: manually updated — update each month from Reckon export

export const JAN_2026: FinancialPeriod = {
  label: '1 March 2025 to 31 January 2026',
  asAtDate: '31 January 2026',

  pnl: [
    { code: '4-0600', name: 'Junior Program',             income: 870.02,    expenses: 1442.43 },
    { code: '4-0100', name: 'Memberships',                income: 19036.34,  expenses: 4029.30 },
    { code: '4-7000', name: 'Coaching Income',            income: 4313.00,   expenses: 1433.00 },
    { code: '4-6000', name: 'Events',                     income: 5635.20,   expenses: 6449.21 },
    { code: '4-0400', name: 'Tournaments',                income: 4980.90,   expenses: 3260.59 },
    { code: '4-0300', name: 'Pennants',                   income: 6787.48,   expenses: 4829.01 },
    { code: '4-0200', name: 'Social Sessions',            income: 8526.25,   expenses: 1945.40 },
    { code: '4-9000', name: 'Other Income',               income: 33945.76,  expenses: 0 },
    { code: '4-0500', name: 'Court Hire',                 income: 9400.60,   expenses: 0 },
    { code: '4-4011', name: 'Drink Sales',                income: 7834.95,   expenses: 4951.11 },
    { code: '4-8001', name: 'Interest Received',          income: 4093.27,   expenses: 0 },
    { code: '6-1200', name: 'Clubhouse',                  income: 0,         expenses: 18634.92 },
    { code: '6-1300', name: 'Courts',                     income: 0,         expenses: 5720.02 },
    { code: '6-1400', name: 'Grounds',                    income: 0,         expenses: 9591.39 },
    { code: '6-7000', name: 'Other Expenditure',          income: 0,         expenses: 6088.86 },
    { code: '6-1100', name: 'Membership Costs',           income: 0,         expenses: 0 }, // included in Memberships above
  ],

  balanceSheet: [
    // Current Assets
    { name: 'Building Fundraiser Term Deposit', amount: 40517.85,  section: 'current_assets' },
    { name: 'Bank - Cards Petty Cash',          amount: 1289.57,   section: 'current_assets' },
    { name: 'Bank - Building Fund',             amount: 10011.93,  section: 'current_assets' },
    { name: 'Bank - Asset Renewal Term Deposit',amount: 63334.88,  section: 'current_assets' },
    { name: 'Bank - Asset Renewal Account',     amount: 32223.01,  section: 'current_assets' },
    { name: 'Bank - Trading Account',           amount: 37918.31,  section: 'current_assets' },
    { name: 'Accounts Receivable',    code: '1-1210', amount: -43.04,    section: 'current_assets' },
    { name: 'Uniform Stock',          code: '1-1302', amount: 455.00,    section: 'current_assets' },
    { name: 'Drinks Stock',           code: '1-1301', amount: 358.87,    section: 'current_assets' },
    // Non-Current Assets
    { name: 'Playground and Shade Sails',        amount: 23850.50,  section: 'non_current_assets' },
    { name: 'Court Booking System Infrastructure',amount: 20738.21, section: 'non_current_assets' },
    { name: 'Plant and Equipment', code: '1-7120', amount: 11934.28, section: 'non_current_assets' },
    // Equity
    { name: 'Opening Balance Equity',  code: '3-0100', amount: 98700.01,  section: 'equity' },
    { name: 'Retained Earnings',       code: '3-1000', amount: 106735.83, section: 'equity' },
    { name: 'Current Year Earnings',                   amount: 37153.53,  section: 'equity' },
  ],

  drinksPOS: {
    periodStart: '01/03/2025',
    periodEnd:   '31/01/2026',
    sales:          7834.95,
    openingStock:   818.08,
    purchases:      4491.90,
    closingStock:   358.87,
    cogs:           4951.11,
    profit:         2883.84,
    grossProfitPct: 37,
  },
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/financialData.ts src/lib/__tests__/financialData.test.ts
git commit -m "feat(data): add Jan 2026 actuals and financial data types"
```

---

### Task A2: Update StatsCards with real figures

**Files:**
- Modify: `src/components/dashboard/StatsCards.tsx`

- [ ] **Step 1: Replace hardcoded stats with real data**

Replace the entire contents of `src/components/dashboard/StatsCards.tsx`:
```tsx
'use client'

import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { JAN_2026, getTotalIncome, getTotalExpenses, getNetPosition } from '@/lib/financialData'

const totalIncome   = getTotalIncome(JAN_2026)
const totalExpenses = getTotalExpenses(JAN_2026)
const netPosition   = getNetPosition(JAN_2026)
const drinksProfit  = JAN_2026.drinksPOS.profit

const stats = [
  {
    name: 'Total Income (YTD)',
    value: `$${totalIncome.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: JAN_2026.label,
    changeType: 'neutral' as const,
    icon: ArrowTrendingUpIcon,
  },
  {
    name: 'Total Expenses (YTD)',
    value: `$${totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: JAN_2026.label,
    changeType: 'neutral' as const,
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Net Position',
    value: `$${netPosition.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: 'Surplus',
    changeType: 'increase' as const,
    icon: ChartBarIcon,
  },
  {
    name: 'Drinks Profit',
    value: `$${drinksProfit.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: `${JAN_2026.drinksPOS.grossProfitPct}% GP`,
    changeType: 'increase' as const,
    icon: ArrowTrendingDownIcon,
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.name} className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon className="h-6 w-6 text-tennis-green-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'increase' ? 'text-green-600'
                  : stat.changeType === 'decrease' ? 'text-red-600'
                  : 'text-gray-500'
                }`}>
                  {stat.change}
                </div>
              </dd>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: ✓ Compiled successfully

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/StatsCards.tsx
git commit -m "feat(dashboard): replace placeholder stats with Jan 2026 actuals"
```

---

### Task A3: Update BudgetOverview chart with real P&L data

**Files:**
- Modify: `src/components/dashboard/BudgetOverview.tsx`

- [ ] **Step 1: Replace hardcoded data**

Replace the `budgetData` constant and update the component to use real P&L category data. Replace entire file:
```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { JAN_2026 } from '@/lib/financialData'

const chartData = JAN_2026.pnl
  .filter(c => c.income > 0 || c.expenses > 0)
  .map(c => ({
    category: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    income: c.income,
    expenses: c.expenses,
  }))

export function BudgetOverview() {
  const totalIncome   = JAN_2026.pnl.reduce((s, c) => s + c.income, 0)
  const totalExpenses = JAN_2026.pnl.reduce((s, c) => s + c.expenses, 0)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Income vs Expenses by Category</h3>
        <div className="text-sm text-gray-500">{JAN_2026.label}</div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 80 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={90} className="text-xs" />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`} />
            <Bar dataKey="income"   name="Income"   fill="#16a34a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.expenses > entry.income ? '#dc2626' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Total Income</div>
          <div className="text-lg font-semibold text-green-600">
            ${totalIncome.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-lg font-semibold text-red-600">
            ${totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/components/dashboard/BudgetOverview.tsx && git commit -m "feat(dashboard): update budget overview chart with real P&L data"
```

---

### Task A4: Update BudgetTracker page with real expense figures

**Files:**
- Modify: `src/components/budget/BudgetTracker.tsx`

- [ ] **Step 1: Replace hardcoded budgetData**

At the top of `src/components/budget/BudgetTracker.tsx`, replace the `budgetData` constant:
```tsx
import { JAN_2026 } from '@/lib/financialData'

const budgetData = JAN_2026.pnl
  .filter(c => c.expenses > 0)
  .map((c, i) => ({
    id: i + 1,
    category: c.name,
    budgetAnnual: Math.round(c.expenses * 1.1), // 10% buffer as indicative annual budget
    spentYTD: c.expenses,
    budgetMonthly: Math.round((c.expenses * 1.1) / 11), // 11 months into FY
    spentThisMonth: 0, // not available at category level without monthly breakdown
  }))
```

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/components/budget/BudgetTracker.tsx && git commit -m "feat(budget): populate budget tracker with real expense figures"
```

---

### Task A5: Add Sidebar navigation link for Transactions page

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add Transactions nav item**

In `src/components/layout/Sidebar.tsx`, add to the `navigation` array (after Dashboard):
```tsx
{ name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
```

And add `ArrowLeftRight` to the existing lucide-react import at the top of the file:
```tsx
import { Home, Plus, BarChart3, FileText, Users, Settings, ArrowLeftRight } from 'lucide-react'
```
Note: the icon is `ArrowLeftRight` in lucide-react (not `ArrowsRightLeftIcon` which is HeroIcons naming).

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/components/layout/Sidebar.tsx && git commit -m "feat(nav): add Transactions link to sidebar"
```

---

## TRACK D — Infrastructure

**Prerequisite:** None. Start immediately.
**Produces:** Anthropic SDK installed, `/api/categorise` route stub, `.env.local.example` updated.
**Note:** The `ANTHROPIC_API_KEY` must also be added manually in Vercel dashboard → Project Settings → Environment Variables.

---

### Task D1: Install Anthropic SDK and create API route stub

**Files:**
- Modify: `package.json`
- Create: `src/app/api/categorise/route.ts`
- Create: `src/lib/server/categoriser.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: Install Anthropic SDK**

```bash
cd C:\Users\Rory\.openclaw\workspace\tennis-expense-tracker
npm install @anthropic-ai/sdk
```

- [ ] **Step 2: Update .env.local.example**

Add to `.env.local.example`:
```
ANTHROPIC_API_KEY=sk-ant-...   # Required for AI cost centre suggestions
```

Create `.env.local` locally (git-ignored):
```
ANTHROPIC_API_KEY=<your key here>
```
**⚠️ Never commit `.env.local` — it is in `.gitignore`.**

- [ ] **Step 3: Create server-side categoriser**

Create `src/lib/server/categoriser.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk'
import { accounts } from '@/lib/accounts'

// ⚠️ SERVER-ONLY — never import this file from a client component.
// Called exclusively from /api/categorise/route.ts

const client = new Anthropic()

export interface CategoriseResult {
  code: string
  name: string
  confidence: 'high' | 'medium' | 'low'
}

const accountList = accounts
  .map(a => `${a.code} ${a.name} (${a.type})`)
  .join('\n')

export async function suggestCostCentre(
  description: string,
  amount: number
): Promise<CategoriseResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a bookkeeper for Safety Bay Tennis Club. Given a bank transaction, suggest the most appropriate cost centre from the chart of accounts below.

Transaction:
- Description: ${description}
- Amount: $${Math.abs(amount).toFixed(2)} (${amount >= 0 ? 'credit/income' : 'debit/expense'})

Chart of accounts:
${accountList}

Reply with ONLY a JSON object in this exact format (no markdown, no explanation):
{"code": "6-1402", "name": "Grounds - Consumables", "confidence": "high"}

Confidence rules:
- "high": description clearly matches one account
- "medium": reasonable match but could be another
- "low": unclear or ambiguous`,
      },
    ],
  })

  const text = (message.content[0] as { type: string; text: string }).text.trim()
  const parsed = JSON.parse(text) as CategoriseResult
  return parsed
}
```

- [ ] **Step 4: Create API route**

Create `src/app/api/categorise/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { suggestCostCentre } from '@/lib/server/categoriser'

export async function POST(req: NextRequest) {
  try {
    const { description, amount } = await req.json() as {
      description: string
      amount: number
    }

    if (!description || amount === undefined) {
      return NextResponse.json({ error: 'description and amount required' }, { status: 400 })
    }

    const result = await suggestCostCentre(description, amount)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Categorise error:', err)
    // Return low-confidence fallback so the UI never blocks
    return NextResponse.json(
      { code: '', name: '', confidence: 'low' },
      { status: 200 }
    )
  }
}
```

- [ ] **Step 5: Build to verify TypeScript**

```bash
npm run build
```
Expected: ✓ Compiled successfully

- [ ] **Step 6: Commit**

```bash
git add src/app/api/categorise/ src/lib/server/ .env.local.example package.json package-lock.json
git commit -m "feat(api): add /api/categorise route with Claude AI cost centre suggestion"
```

- [ ] **Step 7: Add ANTHROPIC_API_KEY to Vercel (manual step)**

In Vercel dashboard → your project → Settings → Environment Variables:
- Key: `ANTHROPIC_API_KEY`
- Value: your Anthropic API key
- Environment: Production + Preview

Then redeploy (push will trigger this).

---

## TRACK B — Transaction Categorisation

**Prerequisite:** Track A complete (types from `financialData.ts` needed). Track D complete (`/api/categorise` route needed).
**Produces:** CSV import page, AI-assisted review table, CSV export.

---

### Task B1: CSV parser with tests

**Files:**
- Create: `src/lib/csvParser.ts`
- Create: `src/lib/__tests__/csvParser.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/csvParser.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseReckonCsv, getMerchantKey } from '@/lib/csvParser'

const SAMPLE_CSV = `Date,Description,Debit,Credit,Balance,Reference
08/01/2026,BUNNINGS ROCKINGHAM,337.45,,12000.00,REF001
12/01/2026,TENNIS WA AFFILIATION,4029.30,,7970.70,REF002
15/01/2026,SQUARE *COURT HIRE,,125.00,8095.70,REF003
,,,,,
Total,,,,,
`

describe('parseReckonCsv', () => {
  it('parses 3 data rows and skips blanks and total', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows).toHaveLength(3)
  })

  it('correctly derives signed amount from debit/credit', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows[0].amount).toBeCloseTo(-337.45) // debit = negative
    expect(rows[2].amount).toBeCloseTo(125.00)  // credit = positive
  })

  it('parses date in DD/MM/YYYY format', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows[0].date).toBe('08/01/2026')
  })

  it('sets status to pending for all rows', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows.every(r => r.status === 'pending')).toBe(true)
  })
})

describe('getMerchantKey', () => {
  it('normalises description to first two tokens', () => {
    expect(getMerchantKey('BUNNINGS ROCKINGHAM')).toBe('BUNNINGS ROCKINGHAM')
  })

  it('strips content after asterisk', () => {
    expect(getMerchantKey('SQUARE *COURT HIRE')).toBe('SQUARE COURT')
  })

  it('handles single-word descriptions', () => {
    expect(getMerchantKey('WOOLWORTHS')).toBe('WOOLWORTHS')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test
```
Expected: FAIL — "Cannot find module '@/lib/csvParser'"

- [ ] **Step 3: Implement csvParser.ts**

Create `src/lib/csvParser.ts`:
```ts
import type { Transaction } from './financialData'

/**
 * Derives a stable merchant key from a raw Reckon transaction description.
 * Used as the localStorage cache key for merchant→account mappings.
 * Rule: uppercase, split on '*', take first segment, then take first two space-separated tokens.
 */
export function getMerchantKey(description: string): string {
  const normalised = description.toUpperCase().split('*')[0].trim()
  const tokens = normalised.split(/\s+/).filter(Boolean)
  return tokens.slice(0, 2).join(' ')
}

/**
 * Parses a Reckon CSV export (Transactions by Account report).
 * Handles: header row, blank rows, "Total" footer row, separate Debit/Credit columns.
 * Date format: DD/MM/YYYY
 * Encoding: call with decoded string (handle Windows-1252 → UTF-8 before passing in)
 */
export function parseReckonCsv(csvText: string): Transaction[] {
  const lines = csvText.split(/\r?\n/)
  const transactions: Transaction[] = []

  for (const line of lines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))

    // Skip header row
    if (cols[0].toLowerCase() === 'date') continue

    // Skip blank rows
    if (!cols[0]) continue

    // Skip total/summary rows
    if (cols[0].toLowerCase().startsWith('total')) continue

    // Must look like a date DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cols[0])) continue

    const date        = cols[0]
    const description = cols[1] || ''
    const debit       = parseFloat(cols[2]) || 0
    const credit      = parseFloat(cols[3]) || 0
    const reference   = cols[5] || ''

    transactions.push({
      date,
      description,
      debit,
      credit,
      amount: credit - debit, // positive = income, negative = expense
      reference,
      status: 'pending',
    })
  }

  return transactions
}

/**
 * Serialises transactions back to CSV for Reckon reimport.
 * Appends AccountCode column. Skipped rows have empty AccountCode.
 * Output: UTF-8 with BOM, DD/MM/YYYY dates preserved.
 */
export function serialiseToReckonCsv(transactions: Transaction[]): string {
  const BOM = '\uFEFF'
  const header = 'Date,Description,Debit,Credit,Balance,Reference,AccountCode'

  const rows = transactions.map(t => {
    const code = t.status === 'confirmed' ? (t.accountCode ?? '') : ''
    return [t.date, t.description, t.debit || '', t.credit || '', '', t.reference, code]
      .map(v => (String(v).includes(',') ? `"${v}"` : v))
      .join(',')
  })

  return BOM + [header, ...rows].join('\r\n')
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/csvParser.ts src/lib/__tests__/csvParser.test.ts
git commit -m "feat(csv): add Reckon CSV parser and serialiser with tests"
```

---

### Task B2: Merchant cache utility

**Files:**
- Create: `src/lib/merchantCache.ts`

- [ ] **Step 1: Create merchant cache**

Create `src/lib/merchantCache.ts`:
```ts
import type { CategoriseResult } from './server/categoriser'
import { getMerchantKey } from './csvParser'

const CACHE_KEY = 'sbtc_merchant_cache'

type MerchantCache = Record<string, { code: string; name: string }>

export function getCachedSuggestion(description: string): CategoriseResult | null {
  if (typeof window === 'undefined') return null
  try {
    const cache: MerchantCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
    const key = getMerchantKey(description)
    const hit = cache[key]
    if (hit) return { ...hit, confidence: 'high' }
    return null
  } catch {
    return null
  }
}

export function setCachedSuggestion(description: string, code: string, name: string): void {
  if (typeof window === 'undefined') return
  try {
    const cache: MerchantCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
    cache[getMerchantKey(description)] = { code, name }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage unavailable — ignore silently
  }
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/lib/merchantCache.ts && git commit -m "feat(cache): add merchant→account localStorage cache"
```

---

### Task B3: Transactions page — upload step

**Files:**
- Create: `src/app/transactions/page.tsx`
- Create: `src/components/transactions/CsvUpload.tsx`

- [ ] **Step 1: Create CsvUpload component**

Create `src/components/transactions/CsvUpload.tsx`:
```tsx
'use client'

import { useRef } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import type { Transaction } from '@/lib/financialData'
import { parseReckonCsv } from '@/lib/csvParser'

interface Props {
  onLoaded: (transactions: Transaction[]) => void
}

export function CsvUpload({ onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const transactions = parseReckonCsv(text)
      onLoaded(transactions)
    }
    // Read as UTF-8 first; Reckon Windows-1252 decodes acceptably for ASCII content
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-tennis-green-500 transition-colors cursor-pointer"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-4 text-lg font-medium text-gray-900">Upload Reckon CSV</p>
      <p className="mt-2 text-sm text-gray-500">
        Export from Reckon: Reports → Transaction Reports → All Transactions → Export CSV
      </p>
      <p className="mt-1 text-xs text-gray-400">Drag and drop or click to browse</p>
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

- [ ] **Step 2: Create transactions page**

Create `src/app/transactions/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { CsvUpload } from '@/components/transactions/CsvUpload'
import type { Transaction } from '@/lib/financialData'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Import your monthly Reckon CSV to assign cost centres with AI assistance.
          </p>
        </div>
        <CsvUpload onLoaded={setTransactions} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {transactions.length} transactions loaded
          </p>
        </div>
        <button
          onClick={() => setTransactions([])}
          className="btn-secondary text-sm"
        >
          Upload new file
        </button>
      </div>
      {/* ReviewTable added in Task B4 */}
      <p className="text-gray-500">Review table coming in next task…</p>
    </div>
  )
}
```

- [ ] **Step 3: Build and commit**

```bash
npm run build && git add src/app/transactions/ src/components/transactions/ && git commit -m "feat(transactions): add CSV upload page"
```

---

### Task B4: Review table with AI suggestions

**Files:**
- Create: `src/components/transactions/ReviewTable.tsx`
- Create: `src/components/transactions/ProgressBar.tsx`
- Modify: `src/app/transactions/page.tsx`

- [ ] **Step 1: Create ProgressBar**

Create `src/components/transactions/ProgressBar.tsx`:
```tsx
interface Props {
  confirmed: number
  skipped: number
  total: number
}

export function ProgressBar({ confirmed, skipped, total }: Props) {
  const done = confirmed + skipped
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {done} / {total} transactions categorised
        </span>
        <span className="text-sm text-gray-500">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-tennis-green-600 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="text-green-600">✓ {confirmed} confirmed</span>
        <span className="text-gray-400">⟶ {skipped} skipped</span>
        <span className="text-orange-500">◌ {total - done} pending</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ReviewTable**

Create `src/components/transactions/ReviewTable.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Transaction } from '@/lib/financialData'
import { accounts, accountLabel } from '@/lib/accounts'
import { getCachedSuggestion, setCachedSuggestion } from '@/lib/merchantCache'

interface Props {
  transactions: Transaction[]
  onChange: (updated: Transaction[]) => void
}

interface Suggestion {
  code: string
  name: string
  confidence: 'high' | 'medium' | 'low'
  loading: boolean
}

const CONFIDENCE_ICON: Record<string, string> = { high: '✓', medium: '~', low: '?' }
const CONFIDENCE_COLOUR: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-500',
  low: 'text-red-500',
}

export function ReviewTable({ transactions, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<Record<number, Suggestion>>({})
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  // Load AI suggestions for pending rows
  useEffect(() => {
    transactions.forEach((t, i) => {
      if (t.status !== 'pending' || suggestions[i]) return

      // Check cache first
      const cached = getCachedSuggestion(t.description)
      if (cached) {
        setSuggestions(s => ({ ...s, [i]: { ...cached, loading: false } }))
        return
      }

      // Mark loading
      setSuggestions(s => ({ ...s, [i]: { code: '', name: '', confidence: 'low', loading: true } }))

      // Call AI API
      fetch('/api/categorise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: t.description, amount: t.amount }),
      })
        .then(r => r.json())
        .then((result: { code: string; name: string; confidence: 'high' | 'medium' | 'low' }) => {
          setSuggestions(s => ({ ...s, [i]: { ...result, loading: false } }))
        })
        .catch(() => {
          setSuggestions(s => ({ ...s, [i]: { code: '', name: 'Error — assign manually', confidence: 'low', loading: false } }))
        })
    })
  }, [transactions, suggestions])

  const confirm = useCallback((i: number) => {
    const sug = suggestions[i]
    if (!sug || !sug.code) return
    setCachedSuggestion(transactions[i].description, sug.code, sug.name)
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, accountCode: sug.code, status: 'confirmed' as const, confidence: sug.confidence } : t
    )
    onChange(updated)
  }, [suggestions, transactions, onChange])

  const skip = useCallback((i: number) => {
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, status: 'skipped' as const } : t
    )
    onChange(updated)
  }, [transactions, onChange])

  const assignManual = useCallback((i: number, code: string) => {
    const account = accounts.find(a => a.code === code)
    if (!account) return
    setCachedSuggestion(transactions[i].description, code, account.name)
    setSuggestions(s => ({ ...s, [i]: { code, name: account.name, confidence: 'high', loading: false } }))
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, accountCode: code, status: 'confirmed' as const, confidence: 'high' as const } : t
    )
    onChange(updated)
    setEditingIdx(null)
  }, [transactions, onChange])

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Date</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Description</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Suggested Cost Centre</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((t, i) => {
            const sug = suggestions[i]
            const isDone = t.status === 'confirmed' || t.status === 'skipped'
            return (
              <tr key={i} className={isDone ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{t.date}</td>
                <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{t.description}</td>
                <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  {t.status === 'confirmed' ? (
                    <span className="text-green-700">{t.accountCode} {accounts.find(a => a.code === t.accountCode)?.name}</span>
                  ) : t.status === 'skipped' ? (
                    <span className="text-gray-400 italic">Skipped</span>
                  ) : editingIdx === i ? (
                    <select
                      autoFocus
                      className="input-field text-sm py-1"
                      defaultValue=""
                      onChange={(e) => assignManual(i, e.target.value)}
                      onBlur={() => setEditingIdx(null)}
                    >
                      <option value="" disabled>Select cost centre…</option>
                      {accounts.map(a => (
                        <option key={a.code} value={a.code}>{a.code} {a.name}</option>
                      ))}
                    </select>
                  ) : sug?.loading ? (
                    <span className="text-gray-400 animate-pulse">Analysing…</span>
                  ) : sug ? (
                    <span className={`font-medium ${CONFIDENCE_COLOUR[sug.confidence]}`}>
                      {CONFIDENCE_ICON[sug.confidence]} {sug.code} {sug.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {!isDone && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirm(i)}
                        disabled={!sug?.code || sug.loading}
                        className="btn-primary text-xs py-1 px-2 disabled:opacity-40"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setEditingIdx(i)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => skip(i)}
                        className="text-gray-400 hover:text-gray-600 text-xs py-1 px-2"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Wire ReviewTable into transactions page**

In `src/app/transactions/page.tsx`:

**3a.** At the top of the file, add two import lines after the existing imports:
```tsx
import { ReviewTable } from '@/components/transactions/ReviewTable'
import { ProgressBar } from '@/components/transactions/ProgressBar'
```

**3b.** Inside the component's second `return` block, replace these two lines:
```tsx
      {/* ReviewTable added in Task B4 */}
      <p className="text-gray-500">Review table coming in next task…</p>
```
with:
```tsx
      <ProgressBar
        confirmed={transactions.filter(t => t.status === 'confirmed').length}
        skipped={transactions.filter(t => t.status === 'skipped').length}
        total={transactions.length}
      />
      <ReviewTable transactions={transactions} onChange={setTransactions} />
```

- [ ] **Step 4: Build and commit**

```bash
npm run build && git add src/components/transactions/ src/app/transactions/ && git commit -m "feat(transactions): add AI-assisted review table with confirm/edit/skip"
```

---

### Task B5: CSV export button

**Files:**
- Create: `src/components/transactions/ExportButton.tsx`
- Modify: `src/app/transactions/page.tsx`

- [ ] **Step 1: Create ExportButton**

Create `src/components/transactions/ExportButton.tsx`:
```tsx
'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import type { Transaction } from '@/lib/financialData'
import { serialiseToReckonCsv } from '@/lib/csvParser'

interface Props {
  transactions: Transaction[]
}

export function ExportButton({ transactions }: Props) {
  const confirmed = transactions.filter(t => t.status === 'confirmed').length
  const total     = transactions.length

  function handleExport() {
    const csv  = serialiseToReckonCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `reckon-categorised-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport} className="btn-primary flex items-center gap-2">
      <ArrowDownTrayIcon className="h-5 w-5" />
      Export CSV ({confirmed}/{total} categorised)
    </button>
  )
}
```

- [ ] **Step 2: Add ExportButton to transactions page**

In `src/app/transactions/page.tsx`, add the export button to the header div:
```tsx
import { ExportButton } from '@/components/transactions/ExportButton'

// In the header flex div, alongside "Upload new file":
<ExportButton transactions={transactions} />
```

- [ ] **Step 3: Build and commit**

```bash
npm run build && git add src/components/transactions/ExportButton.tsx src/app/transactions/page.tsx && git commit -m "feat(transactions): add CSV export button"
```

---

## TRACK C — Report Generation

**Prerequisite:** Track A complete (`JAN_2026` data and types available).
**Produces:** Branded P&L, Balance Sheet, and Drinks POS report components. `/reports` page upgraded.

---

### Task C1: Add print CSS to globals

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add print styles**

Append to `src/app/globals.css`:
```css
@media print {
  nav, header, aside, .no-print { display: none !important; }
  body { background: white; }
  .card { box-shadow: none; border: 1px solid #e5e7eb; }
  .print-break { page-break-before: always; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css && git commit -m "feat(reports): add print CSS for PDF generation"
```

---

### Task C2: P&L Summary report component

**Files:**
- Create: `src/components/reports/PLReport.tsx`

- [ ] **Step 1: Create component**

Create `src/components/reports/PLReport.tsx`:
```tsx
import Image from 'next/image'
import { JAN_2026, getTotalIncome, getTotalExpenses, getNetPosition } from '@/lib/financialData'

export function PLReport() {
  const period = JAN_2026
  const totalIncome   = getTotalIncome(period)
  const totalExpenses = getTotalExpenses(period)
  const netPosition   = getNetPosition(period)
  const fmt = (n: number) =>
    n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const incomeRows = period.pnl.filter(c => c.income > 0)
  const expenseRows = period.pnl.filter(c => c.expenses > 0)

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto font-sans text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/sbtc_logo.png" alt="SBTC" width={48} height={48} className="object-contain" />
          <div>
            <div className="text-lg font-bold text-gray-900">Safety Bay Tennis Club</div>
            <div className="text-xs text-gray-500">Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-gray-900">Profit &amp; Loss</div>
          <div className="text-xs text-gray-500">For {period.label}</div>
          <div className="text-xs text-gray-500">Accrual basis</div>
        </div>
      </div>

      {/* Income */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Income</div>
        <table className="w-full">
          <tbody>
            {incomeRows.map(c => (
              <tr key={c.code} className="border-b border-gray-100">
                <td className="py-1 text-gray-700">{c.name}</td>
                <td className="py-1 text-right font-mono text-gray-900">${fmt(c.income)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2 text-gray-900">TOTAL INCOME</td>
              <td className="py-2 text-right font-mono text-gray-900">${fmt(totalIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expenses */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Expenses</div>
        <table className="w-full">
          <tbody>
            {expenseRows.map(c => (
              <tr key={c.code} className="border-b border-gray-100">
                <td className="py-1 text-gray-700">{c.name}</td>
                <td className="py-1 text-right font-mono text-gray-900">${fmt(c.expenses)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2 text-gray-900">TOTAL EXPENSES</td>
              <td className="py-2 text-right font-mono text-gray-900">${fmt(totalExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Position */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">NET POSITION</span>
          <span className={`text-xl font-bold font-mono ${netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ${fmt(netPosition)}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">Surplus</div>
      </div>

      <div className="mt-6 text-xs text-gray-400 text-center">
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/components/reports/PLReport.tsx && git commit -m "feat(reports): add branded P&L summary report component"
```

---

### Task C3: Balance Sheet report component

**Files:**
- Create: `src/components/reports/BalanceSheetReport.tsx`

- [ ] **Step 1: Create component**

Create `src/components/reports/BalanceSheetReport.tsx`:
```tsx
import Image from 'next/image'
import { JAN_2026 } from '@/lib/financialData'

export function BalanceSheetReport() {
  const period = JAN_2026
  const fmt = (n: number) =>
    n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const currentAssets    = period.balanceSheet.filter(l => l.section === 'current_assets')
  const nonCurrentAssets = period.balanceSheet.filter(l => l.section === 'non_current_assets')
  const equity           = period.balanceSheet.filter(l => l.section === 'equity')

  const totalCurrent    = currentAssets.reduce((s, l) => s + l.amount, 0)
  const totalNonCurrent = nonCurrentAssets.reduce((s, l) => s + l.amount, 0)
  const totalAssets     = totalCurrent + totalNonCurrent
  const totalEquity     = equity.reduce((s, l) => s + l.amount, 0)

  const Section = ({ title, rows, total, label }: {
    title: string
    rows: typeof currentAssets
    total: number
    label: string
  }) => (
    <div className="mb-5">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{title}</div>
      <table className="w-full">
        <tbody>
          {rows.map((l, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1 text-gray-700 pl-4">{l.name}</td>
              <td className="py-1 text-right font-mono text-gray-900">${fmt(l.amount)}</td>
            </tr>
          ))}
          <tr className="border-t border-gray-400 font-semibold">
            <td className="py-1 text-gray-900">{label}</td>
            <td className="py-1 text-right font-mono text-gray-900">${fmt(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto font-sans text-sm">
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/sbtc_logo.png" alt="SBTC" width={48} height={48} className="object-contain" />
          <div>
            <div className="text-lg font-bold text-gray-900">Safety Bay Tennis Club</div>
            <div className="text-xs text-gray-500">Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-gray-900">Balance Sheet</div>
          <div className="text-xs text-gray-500">As at {period.asAtDate}</div>
          <div className="text-xs text-gray-500">Accrual basis</div>
        </div>
      </div>

      <Section title="Current Assets"     rows={currentAssets}    total={totalCurrent}    label="Total Current Assets" />
      <Section title="Non-Current Assets" rows={nonCurrentAssets} total={totalNonCurrent} label="Total Non-Current Assets" />

      <div className="flex justify-between font-bold border-t-2 border-gray-800 pt-2 mb-6">
        <span>TOTAL ASSETS</span>
        <span className="font-mono">${fmt(totalAssets)}</span>
      </div>

      <Section title="Equity" rows={equity} total={totalEquity} label="Total Equity" />

      <div className="mt-6 text-xs text-gray-400 text-center">
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/components/reports/BalanceSheetReport.tsx && git commit -m "feat(reports): add branded balance sheet report component"
```

---

### Task C4: Drinks POS report component

**Files:**
- Create: `src/components/reports/DrinksReport.tsx`

- [ ] **Step 1: Create component**

Create `src/components/reports/DrinksReport.tsx`:
```tsx
import Image from 'next/image'
import { JAN_2026 } from '@/lib/financialData'

export function DrinksReport() {
  const d = JAN_2026.drinksPOS
  const fmt = (n: number) =>
    n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="bg-white p-8 max-w-xl mx-auto font-sans text-sm">
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/sbtc_logo.png" alt="SBTC" width={48} height={48} className="object-contain" />
          <div>
            <div className="text-lg font-bold text-gray-900">Safety Bay Tennis Club</div>
            <div className="text-xs text-gray-500">Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-gray-900">Drinks Profit on Sales</div>
          <div className="text-xs text-gray-500">
            {d.periodStart} to {d.periodEnd}
          </div>
        </div>
      </div>

      <table className="w-full">
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-2 font-semibold text-gray-900">Sales</td>
            <td className="py-2 text-right font-mono font-semibold text-gray-900">${fmt(d.sales)}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600 pl-4">Opening Stock</td>
            <td className="py-1 text-right font-mono text-gray-600">${fmt(d.openingStock)}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600 pl-4">add Purchases</td>
            <td className="py-1 text-right font-mono text-gray-600">${fmt(d.purchases)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-1 text-gray-600 pl-4">less Closing Stock</td>
            <td className="py-1 text-right font-mono text-gray-600">${fmt(d.closingStock)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 font-semibold text-gray-900">Cost of Goods Sold</td>
            <td className="py-2 text-right font-mono font-semibold text-gray-900">${fmt(d.cogs)}</td>
          </tr>
          <tr className="border-b-2 border-gray-800">
            <td className="py-3 font-bold text-gray-900">Profit on Sales</td>
            <td className="py-3 text-right font-mono font-bold text-green-700">${fmt(d.profit)}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-700">Gross Profit %</td>
            <td className="py-2 text-right font-mono font-semibold text-gray-900">{d.grossProfitPct}%</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 text-xs text-gray-400 text-center">
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/components/reports/DrinksReport.tsx && git commit -m "feat(reports): add branded drinks POS report component"
```

---

### Task C5: Upgrade reports page

**Files:**
- Modify: `src/app/reports/page.tsx`
- Modify: `src/components/reports/FinancialReports.tsx`

- [ ] **Step 1: Replace FinancialReports with report pack page**

Replace entire contents of `src/components/reports/FinancialReports.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { PrinterIcon } from '@heroicons/react/24/outline'
import { PLReport } from './PLReport'
import { BalanceSheetReport } from './BalanceSheetReport'
import { DrinksReport } from './DrinksReport'

type ReportType = 'pl' | 'balance' | 'drinks'

const REPORTS: { id: ReportType; label: string }[] = [
  { id: 'pl',      label: 'Profit & Loss' },
  { id: 'balance', label: 'Balance Sheet' },
  { id: 'drinks',  label: 'Drinks POS'    },
]

export function FinancialReports() {
  const [active, setActive] = useState<ReportType>('pl')

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card flex items-center justify-between">
        <div className="flex gap-2">
          {REPORTS.map(r => (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className={active === r.id ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-2 text-sm no-print"
        >
          <PrinterIcon className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Report */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {active === 'pl'      && <PLReport />}
        {active === 'balance' && <BalanceSheetReport />}
        {active === 'drinks'  && <DrinksReport />}
      </div>

      <p className="text-xs text-gray-400 no-print text-center">
        To save as PDF: Print → Save as PDF → Destination: Save as PDF
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build && git add src/components/reports/FinancialReports.tsx && git commit -m "feat(reports): upgrade reports page with branded P&L, Balance Sheet, Drinks POS"
```

---

## TRACK I — Integration & Deploy

**Prerequisite:** All tracks A, B, C, D complete.

---

### Task I1: Final build verification and push

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: all tests PASS

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```
Expected: no errors

- [ ] **Step 3: Run production build**

```bash
npm run build
```
Expected: ✓ all 9 routes compiled successfully

- [ ] **Step 4: Verify ANTHROPIC_API_KEY is set in Vercel**

Check Vercel dashboard → Project Settings → Environment Variables.
If missing, add it now before pushing (otherwise `/api/categorise` will return low-confidence for all rows).

- [ ] **Step 5: Push to trigger Vercel deploy**

```bash
git push
```

- [ ] **Step 6: Smoke test on tennis.automateyourbiz.app**

- [ ] Dashboard shows real figures (Total Income $105,528.77)
- [ ] Reports page: P&L, Balance Sheet, Drinks POS all render with SBTC branding
- [ ] Print a report to PDF — verify it looks clean
- [ ] Transactions page: upload a sample CSV — verify rows appear in table
- [ ] AI suggestions load for each row
- [ ] Confirm a row → verify status changes to confirmed
- [ ] Export CSV — verify download triggers and AccountCode column is present

---

### Task I2: Post-deploy checklist

- [ ] Verify `tennis.automateyourbiz.app` resolves and SSL is valid
- [ ] Confirm Reports page has no console errors
- [ ] Confirm Transactions page AI suggestions work (check Network tab for `/api/categorise` calls returning 200)
- [ ] Share URL with treasurer for review: `https://tennis.automateyourbiz.app`
