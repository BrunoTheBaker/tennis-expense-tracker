# Square Allocation Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the cost centre allocation workflow with Square catalog signals — auto-matching cost centres from Square category names, showing a hover popover with full order detail, and passing Square item context to the AI suggester.

**Architecture:** Three layers built bottom-up: (1) extend the Transaction type with Square fields and populate them in transforms.ts; (2) add SQUARE_CATEGORY_MAP to costCentres.ts and update the categoriser to use Square signals as the primary scoring input; (3) add SquareTransactionPopover and update CostCentrePicker to show auto-match labels, wired into ReviewTable.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Tailwind CSS 3, Vitest 2, Anthropic SDK (`claude-sonnet-4-5`)

---

## Codebase orientation (read before starting)

- **Transaction type**: `src/lib/financialData.ts:3-14` — the shared data model. Square fields will be added as optional properties here.
- **transforms.ts**: `src/lib/square/transforms.ts` — `squareLineItemToTransaction()` builds Transaction objects from Square Orders API responses. Currently does NOT populate Square-specific fields.
- **categoriser.ts**: `src/lib/categoriser.ts` — `suggestCostCentres(description: string)` does keyword scoring. `aiSuggestCostCentres({ description, amount, source })` calls `/api/ai-categorise`. Both signatures change in this plan.
- **costCentres.ts**: `src/lib/costCentres.ts` — COST_CENTRES array + COST_CENTRE_MAP. SQUARE_CATEGORY_MAP will be added here.
- **CostCentrePicker**: `src/components/allocation/CostCentrePicker.tsx` — calls `aiSuggestCostCentres` in a useEffect keyed on `transactionDescription`. Props are individual strings; will change to accept full Transaction.
- **ReviewTable**: `src/components/transactions/ReviewTable.tsx` — renders CostCentrePicker per row. Passes individual fields today; will pass the full transaction.
- **Allocation page**: `src/app/transactions/page.tsx` — NOTE: the spec says `src/app/allocation/page.tsx` but the actual file is `src/app/transactions/page.tsx`. Use the actual path.
- **ai-categorise route**: `src/app/api/ai-categorise/route.ts` — server proxy to Claude. Accepts `{ description, amount, source }` today; will accept Square fields too.
- **Square categories from live API** (19 categories, use these exact names in SQUARE_CATEGORY_MAP):
  `Monday Social`, `Wednesday Night Social`, `Thursday Social`, `Friday Social`, `Friday Evening`, `Sunday Social`, `Pickleball`, `Junior Social`, `Drinks`, `Membership Fees`, `Pennant Fees`, `Tournaments`, `Canteen`, `TW Canteen`, `Events`, `Balls`, `Uniforms`, `Social Tennis fees`, `Fees`

---

## File map

**Create:**
- `src/lib/square/orderGroups.ts`
- `src/components/allocation/SquareTransactionPopover.tsx`
- `src/lib/square/__tests__/orderGroups.test.ts`

**Modify:**
- `src/lib/financialData.ts` — add 4 optional Square fields to Transaction interface
- `src/lib/square/transforms.ts` — populate new fields in `squareLineItemToTransaction`
- `src/lib/costCentres.ts` — add `SQUARE_CATEGORY_MAP`
- `src/lib/categoriser.ts` — update `suggestCostCentres` signature + scoring; update `AiCategoriseRequest` → accept Transaction
- `src/app/api/ai-categorise/route.ts` — pass Square fields in Claude prompt
- `src/components/allocation/CostCentrePicker.tsx` — accept `transaction: Transaction` prop; show auto-match label
- `src/components/transactions/ReviewTable.tsx` — pass full transaction to picker; mount popover
- `src/lib/__tests__/categoriser.test.ts` — update existing tests + add Square signal tests

---

### Task 1: Extend Transaction type and populate Square fields in transforms

**Files:**
- Modify: `src/lib/financialData.ts`
- Modify: `src/lib/square/transforms.ts`
- Test: `src/lib/square/__tests__/api.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/square/__tests__/api.test.ts` inside the existing `squareLineItemToTransaction` describe block:

```ts
it('populates squareCategory, squareItemName, squareItemId, and orderId', () => {
  const order: Order = {
    id: 'ord_xyz', location_id: 'LOC1', state: 'COMPLETED',
    created_at: '2026-03-29T06:00:00Z', updated_at: '2026-03-29T06:00:00Z',
    total_money: { amount: 400, currency: 'AUD' },
  }
  const lineItem: OrderLineItem = {
    uid: 'li1', name: 'Day Fee', quantity: '1', item_type: 'ITEM',
    variation_name: 'Regular',
    base_price_money: { amount: 400, currency: 'AUD' },
    total_money: { amount: 406, currency: 'AUD' },
    catalog_object_id: 'VAR_SUNDAY',
  }

  const tx = squareLineItemToTransaction(lineItem, order, 'Sunday Social')

  expect(tx.squareCategory).toBe('Sunday Social')
  expect(tx.squareItemName).toBe('Day Fee')
  expect(tx.squareItemId).toBe('VAR_SUNDAY')
  expect(tx.orderId).toBe('ord_xyz')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd .worktrees/<your-branch>
npx vitest run src/lib/square/__tests__/api.test.ts
```

Expected: FAIL — `tx.squareCategory` is `undefined`

- [ ] **Step 3: Add Square fields to Transaction type**

In `src/lib/financialData.ts`, update the Transaction interface:

```ts
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
  source?: 'reckon' | 'square' | 'stripe'
  // Square-specific fields (undefined for non-Square transactions)
  orderId?: string          // groups line items from the same terminal tap
  squareCategory?: string   // Square catalog category name e.g. 'Sunday Social'
  squareItemName?: string   // Square catalog item name e.g. 'Day Fee'
  squareItemId?: string     // Square catalog_object_id (variation ID)
}
```

- [ ] **Step 4: Populate Square fields in squareLineItemToTransaction**

In `src/lib/square/transforms.ts`, update `squareLineItemToTransaction`:

```ts
export function squareLineItemToTransaction(
  lineItem: OrderLineItem,
  order: Order,
  categoryName?: string
): Transaction {
  const credit = lineItem.base_price_money.amount / 100
  const parts = [categoryName, lineItem.name].filter(Boolean)
  const description = parts.join(' – ')

  return {
    date:           isoToDisplayDate(order.created_at),
    description:    description || 'Square item',
    debit:          0,
    credit,
    amount:         credit,
    reference:      order.id,
    status:         'pending',
    source:         'square',
    accountCode:    undefined,
    // Square-specific fields
    orderId:        order.id,
    squareCategory: categoryName,
    squareItemName: lineItem.name,
    squareItemId:   lineItem.catalog_object_id,
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/square/__tests__/api.test.ts
```

Expected: all tests PASS (8 total including the new one)

- [ ] **Step 6: Commit**

```bash
git add src/lib/financialData.ts src/lib/square/transforms.ts src/lib/square/__tests__/api.test.ts
git commit -m "feat(square): add orderId/squareCategory/squareItemName/squareItemId to Transaction"
```

---

### Task 2: SQUARE_CATEGORY_MAP + updated categoriser

**Files:**
- Modify: `src/lib/costCentres.ts`
- Modify: `src/lib/categoriser.ts`
- Modify: `src/app/api/ai-categorise/route.ts`
- Test: `src/lib/__tests__/categoriser.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/__tests__/categoriser.test.ts`. First add a helper at the top of the file (after imports):

```ts
import type { Transaction } from '@/lib/financialData'

function makeTx(description: string, extra: Partial<Transaction> = {}): Transaction {
  return {
    description, amount: 10, debit: 0, credit: 10,
    date: '01/01/2026', reference: 'ref', status: 'pending',
    ...extra,
  }
}
```

Then update ALL existing `suggestCostCentres('...')` calls to `suggestCostCentres(makeTx('...'))`. Then add new describe blocks:

```ts
describe('suggestCostCentres — Square category signals', () => {
  it('returns high-confidence match for Sunday Social squareCategory', () => {
    const tx = makeTx('Sunday Social – Day Fee', { squareCategory: 'Sunday Social' })
    const results = suggestCostCentres(tx)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].costCentre.ledgerCode).toBe('4-0207')
    expect(results[0].confidence).toBe('high')
    expect(results[0].score).toBeGreaterThanOrEqual(0.9)
  })

  it('returns high-confidence match for Drinks squareCategory', () => {
    const tx = makeTx('Drinks – Soft Drink', { squareCategory: 'Drinks' })
    const results = suggestCostCentres(tx)
    expect(results[0].costCentre.ledgerCode).toBe('4-4011')
    expect(results[0].confidence).toBe('high')
  })

  it('falls back to description scoring when squareCategory has no mapping', () => {
    const tx = makeTx('SYNERGY ELECTRICITY POWER ENERGY UTILITY BPAY', {
      squareCategory: 'UnknownCategory',
    })
    const results = suggestCostCentres(tx)
    // Falls through to description keywords — electricity should still match
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].costCentre.ledgerCode).toBe('6-1203')
  })

  it('returns [] for empty description and no squareCategory', () => {
    expect(suggestCostCentres(makeTx(''))).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/categoriser.test.ts
```

Expected: FAIL — `suggestCostCentres` still takes a string, not a Transaction

- [ ] **Step 3: Add SQUARE_CATEGORY_MAP to costCentres.ts**

Append to the bottom of `src/lib/costCentres.ts` (after the COST_CENTRE_MAP export):

```ts
/**
 * Maps Square POS catalog category names → Reckon ledger codes.
 * Derived from the SBTC Square account at Safety Bay Tennis Club.
 * These are the 19 categories returned by GET /v2/catalog/list?types=CATEGORY.
 * Where a mapping exists, treat it as high-confidence ground truth.
 */
export const SQUARE_CATEGORY_MAP: Record<string, string> = {
  'Monday Social':          '4-0201',  // Social Sessions - Mondays
  'Wednesday Night Social': '4-0202',  // Social Sessions - Wednesday Nights
  'Thursday Social':        '4-0203',  // Social Sessions - Thursday Ladies
  'Pickleball':             '4-0204',  // Social Sessions - Sunday Pickleball
  'Friday Social':          '4-0205',  // Social Sessions - Fridays
  'Friday Evening':         '4-0206',  // Social Sessions - Friday Nights
  'Sunday Social':          '4-0207',  // Social Sessions - Sundays
  'Junior Social':          '4-0600',  // Junior Program (parent)
  'Drinks':                 '4-4011',  // Drink Sales
  'Membership Fees':        '4-0101',  // Memberships - Adult/Senior (most common type)
  'Pennant Fees':           '4-0301',  // Pennants - Tennis West Fees
  'Tournaments':            '4-0401',  // Tournaments - Nomination Fees
  'Canteen':                '4-4011',  // Drink Sales (canteen sales = drinks at SBTC)
  'TW Canteen':             '4-0402',  // Tournaments - Canteen Sales
  'Events':                 '4-6000',  // Events
  'Uniforms':               '4-0113',  // Uniforms
  'Balls':                  '4-4014',  // New Balls (income side for POS ball sales)
  'Social Tennis fees':     '4-0200',  // Social Sessions (parent — item name determines sub-code)
  'Fees':                   '4-0200',  // Social Sessions (generic — item name determines sub-code)
}
```

- [ ] **Step 4: Update suggestCostCentres to accept Transaction**

Replace the entire `suggestCostCentres` function in `src/lib/categoriser.ts`:

```ts
import { COST_CENTRES, SQUARE_CATEGORY_MAP, COST_CENTRE_MAP, type CostCentre } from './costCentres'
import type { Transaction } from './financialData'

// ... keep CostCentreSuggestion interface and scoreCostCentre helper unchanged ...

/**
 * Pure cost centre suggestions. Scoring priority:
 * 1. squareCategory exact match in SQUARE_CATEGORY_MAP → score 0.95
 * 2. description keyword scoring (existing logic) → score 0–1
 * Returns up to MAX_SUGGESTIONS entries with score ≥ MIN_SCORE, ordered by score.
 */
export function suggestCostCentres(transaction: Transaction): CostCentreSuggestion[] {
  const { description, squareCategory } = transaction

  // Priority 1: Square category exact map lookup
  if (squareCategory) {
    const ledgerCode = SQUARE_CATEGORY_MAP[squareCategory]
    if (ledgerCode) {
      const cc = COST_CENTRE_MAP.get(ledgerCode)
      if (cc) {
        return [{
          costCentre: cc,
          score: 0.95,
          confidence: 'high',
          reason: 'Auto-matched via Square',
        }]
      }
    }
  }

  // Priority 2: description keyword scoring (fallback)
  if (!description.trim()) return []

  const scored = COST_CENTRES
    .map(cc => ({ cc, score: scoreCostCentre(cc, description) }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)

  return scored.map(({ cc, score }) => ({
    costCentre: cc,
    score,
    confidence: score >= 0.7 ? 'high' : score >= 0.45 ? 'medium' : 'low',
  }))
}
```

- [ ] **Step 5: Update AiCategoriseRequest and aiSuggestCostCentres**

Replace `AiCategoriseRequest` and `aiSuggestCostCentres` in `src/lib/categoriser.ts`:

```ts
export interface AiCategoriseRequest {
  description: string
  amount: number
  source?: string
  squareCategory?: string
  squareItemName?: string
}

/**
 * Calls /api/ai-categorise and returns AI-ranked suggestions.
 * Falls back to keyword suggestions if the request fails.
 */
export async function aiSuggestCostCentres(
  transaction: Transaction
): Promise<CostCentreSuggestion[]> {
  // If squareCategory maps directly, skip the AI call — we already have a high-confidence answer
  if (transaction.squareCategory && SQUARE_CATEGORY_MAP[transaction.squareCategory]) {
    return suggestCostCentres(transaction)
  }

  const req: AiCategoriseRequest = {
    description:    transaction.description,
    amount:         transaction.amount,
    source:         transaction.source,
    squareCategory: transaction.squareCategory,
    squareItemName: transaction.squareItemName,
  }

  try {
    const res = await fetch('/api/ai-categorise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    if (!res.ok) {
      console.warn('[aiSuggestCostCentres] API error', res.status)
      return suggestCostCentres(transaction)
    }

    const data = await res.json() as { suggestions: CostCentreSuggestion[] }
    return data.suggestions ?? []
  } catch (err) {
    console.warn('[aiSuggestCostCentres] fetch failed, falling back to keyword scorer', err)
    return suggestCostCentres(transaction)
  }
}
```

- [ ] **Step 6: Update /api/ai-categorise/route.ts**

Update `RequestBody` and the prompt in `src/app/api/ai-categorise/route.ts`:

```ts
interface RequestBody {
  description: string
  amount: number
  source?: string
  squareCategory?: string
  squareItemName?: string
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json() as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { description, amount, source, squareCategory, squareItemName } = body
  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  const keywordSuggestions = suggestCostCentres({
    description, amount, debit: 0, credit: amount,
    date: '', reference: '', status: 'pending',
    squareCategory, squareItemName,
  })
    .map(s => s.costCentre.ledgerCode)
    .join(', ')

  const squareContext = squareCategory
    ? `Square catalog category: "${squareCategory}"${squareItemName ? `, item: "${squareItemName}"` : ''}`
    : 'No Square catalog data available'

  const prompt = `You are an accounting assistant for Safety Bay Tennis Club (SBTC), a community tennis club in Perth, WA.

Classify the following bank transaction to the most appropriate cost centre(s).

Transaction:
  Description: ${description}
  Amount: $${Math.abs(amount).toFixed(2)} (${amount < 0 ? 'debit/expense' : 'credit/income'})
  Source: ${source ?? 'bank'}
  ${squareContext}
  Keyword hints: ${keywordSuggestions || 'none'}

Square category mappings (treat these as ground truth where present):
${Object.entries(SQUARE_CATEGORY_MAP).map(([cat, code]) => `  "${cat}" → ${code}`).join('\n')}

Available cost centres:
${CC_LIST}

Return a JSON array of up to 3 suggestions, ordered by best match first:
[
  { "ledgerCode": "x-xxxx", "confidence": "high|medium|low", "reason": "brief reason" },
  ...
]

Rules:
- Only return codes that exist in the list above.
- If a Square category mapping exists above for this transaction, use it as the top result with confidence "high".
- confidence "high" = very clear match, "medium" = probable, "low" = possible but uncertain.
- Use expense accounts (6-xxxx) for debits, income accounts (4-xxxx) for credits, COGS (5-xxxx) for drink stock purchases.
- Synergy = electricity (6-1203), Pentanet = internet (6-1211), City of Rockingham = rates (6-1210), Jim's Mowing / Barras Mowing = grounds maintenance (6-1403), BWS = drinks stock purchase (5-1000), Fox Tennis Academy / Karen Wenham = coaching lease (4-7004), Stripe payout = court hire (4-0501), interest on term deposit = interest received (4-8001).
- Return ONLY the JSON array, no other text.`

  // ... rest of the function unchanged (Anthropic call + response mapping)
```

Note: import `SQUARE_CATEGORY_MAP` at the top of the route file:
```ts
import { COST_CENTRES, COST_CENTRE_MAP, SQUARE_CATEGORY_MAP } from '@/lib/costCentres'
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/categoriser.test.ts
```

Expected: all tests PASS (existing 7 + new 4 = 11 total)

- [ ] **Step 8: Commit**

```bash
git add src/lib/costCentres.ts src/lib/categoriser.ts src/app/api/ai-categorise/route.ts src/lib/__tests__/categoriser.test.ts
git commit -m "feat(categoriser): SQUARE_CATEGORY_MAP + Transaction-based scoring with Square signal priority"
```

---

### Task 3: orderGroups utility

**Files:**
- Create: `src/lib/square/orderGroups.ts`
- Create: `src/lib/square/__tests__/orderGroups.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/square/__tests__/orderGroups.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { groupByOrder, getOrderSiblings, getOrderTotal } from '../orderGroups'
import type { Transaction } from '@/lib/financialData'

function makeTx(id: string, orderId: string, amount: number): Transaction {
  return {
    description: `Item ${id}`, date: '29/03/2026', debit: 0, credit: amount,
    amount, reference: orderId, status: 'pending', source: 'square', orderId,
  }
}

const txA1 = makeTx('a1', 'ord-A', 4.00)
const txA2 = makeTx('a2', 'ord-A', 4.50)
const txA3 = makeTx('a3', 'ord-A', 4.50)
const txB1 = makeTx('b1', 'ord-B', 8.00)
const txNoOrder: Transaction = {
  description: 'Cash', date: '01/01/2026', debit: 0, credit: 5,
  amount: 5, reference: 'ref', status: 'pending',
}

describe('groupByOrder', () => {
  it('groups transactions by orderId', () => {
    const map = groupByOrder([txA1, txA2, txA3, txB1])
    expect(map.get('ord-A')).toHaveLength(3)
    expect(map.get('ord-B')).toHaveLength(1)
  })

  it('omits transactions without orderId', () => {
    const map = groupByOrder([txA1, txNoOrder])
    expect(map.size).toBe(1)
    expect(map.has('ord-A')).toBe(true)
  })
})

describe('getOrderSiblings', () => {
  it('returns other transactions with the same orderId, excluding self', () => {
    const siblings = getOrderSiblings(txA1, [txA1, txA2, txA3, txB1])
    expect(siblings).toHaveLength(2)
    expect(siblings.some(t => t === txA1)).toBe(false)
  })

  it('returns [] when transaction has no orderId', () => {
    expect(getOrderSiblings(txNoOrder, [txA1, txNoOrder])).toEqual([])
  })
})

describe('getOrderTotal', () => {
  it('sums amounts of all transactions sharing the same orderId', () => {
    const total = getOrderTotal(txA1, [txA1, txA2, txA3, txB1])
    expect(total).toBeCloseTo(13.00)
  })

  it('returns the transaction amount alone when it has no siblings', () => {
    expect(getOrderTotal(txB1, [txB1])).toBeCloseTo(8.00)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/square/__tests__/orderGroups.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement orderGroups.ts**

Create `src/lib/square/orderGroups.ts`:

```ts
import type { Transaction } from '@/lib/financialData'

/** Groups transactions by their orderId. Transactions without orderId are omitted. */
export function groupByOrder(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    if (!tx.orderId) continue
    const group = map.get(tx.orderId)
    if (group) {
      group.push(tx)
    } else {
      map.set(tx.orderId, [tx])
    }
  }
  return map
}

/**
 * Returns all transactions that share the same orderId as the given transaction,
 * excluding the transaction itself.
 */
export function getOrderSiblings(
  transaction: Transaction,
  allTransactions: Transaction[]
): Transaction[] {
  if (!transaction.orderId) return []
  return allTransactions.filter(
    t => t !== transaction && t.orderId === transaction.orderId
  )
}

/**
 * Calculates the total amount across all transactions with the same orderId
 * (including the transaction itself).
 */
export function getOrderTotal(
  transaction: Transaction,
  allTransactions: Transaction[]
): number {
  if (!transaction.orderId) return transaction.amount
  return allTransactions
    .filter(t => t.orderId === transaction.orderId)
    .reduce((sum, t) => sum + t.amount, 0)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/square/__tests__/orderGroups.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/square/orderGroups.ts src/lib/square/__tests__/orderGroups.test.ts
git commit -m "feat(square): orderGroups utility (groupByOrder, getOrderSiblings, getOrderTotal)"
```

---

### Task 4: SquareTransactionPopover component

**Files:**
- Create: `src/components/allocation/SquareTransactionPopover.tsx`

No unit tests for this component (visual/positioning logic). Manual test: hover a Square row in the allocation table after Task 5 is done.

- [ ] **Step 1: Create the component**

Create `src/components/allocation/SquareTransactionPopover.tsx`:

```tsx
'use client'

import type { Transaction } from '@/lib/financialData'
import { getOrderSiblings, getOrderTotal } from '@/lib/square/orderGroups'

interface Props {
  transaction: Transaction
  allTransactions: Transaction[]
}

/** Formats DD/MM/YYYY + time from ISO string (Perth AWST = UTC+8) */
function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  // Offset by +8 hours for Perth time
  const perth = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const day = perth.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  })
  const time = perth.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
  })
  return `${day} ${time}`
}

export default function SquareTransactionPopover({ transaction, allTransactions }: Props) {
  const siblings = getOrderSiblings(transaction, allTransactions)
  const orderItems = [transaction, ...siblings].sort((a, b) => a.description.localeCompare(b.description))
  const orderTotal = getOrderTotal(transaction, allTransactions)
  const hasOrder = siblings.length > 0

  return (
    <div
      className="card absolute left-full top-0 ml-2 z-50 shadow-lg"
      style={{
        width: '300px',
        minWidth: '260px',
        fontSize: '13px',
        pointerEvents: 'none',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{ background: 'rgba(29,158,117,0.1)', borderBottom: '1px solid var(--border)' }}
      >
        <span style={{ color: '#1D9E75', fontWeight: 600, fontSize: '12px' }}>
          ■ Square transaction
        </span>
      </div>

      {/* Fields */}
      <div className="px-3 py-2 space-y-1" style={{ borderBottom: hasOrder ? '1px solid var(--border)' : undefined }}>
        <Row label="Category" value={transaction.squareCategory ?? '—'} />
        <Row label="Item"     value={transaction.squareItemName ?? '—'} />
        <Row label="Amount"   value={`$${transaction.amount.toFixed(2)}`} mono />
        <Row label="Date"     value={transaction.date} />
      </div>

      {/* Order siblings */}
      {hasOrder && (
        <div className="px-3 py-2">
          <p className="mb-1.5" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 500 }}>
            Part of order with {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-0.5">
            {orderItems.map((t, i) => (
              <div key={i} className="flex justify-between">
                <span style={{ color: 'var(--text-2)', fontSize: '12px' }} className="truncate mr-2">
                  {t.description}
                </span>
                <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px' }} className="shrink-0">
                  ${t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-3)', fontSize: '12px', fontWeight: 500 }}>Order total</span>
            <span style={{ color: 'var(--text-1)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', fontWeight: 600 }}>
              ${orderTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span style={{ color: 'var(--text-3)', fontSize: '12px', minWidth: '64px' }}>{label}</span>
      <span
        style={{
          color: 'var(--text-1)',
          fontSize: '12px',
          fontFamily: mono ? 'var(--font-dm-mono)' : undefined,
          textAlign: 'right',
        }}
        className="truncate"
      >
        {value}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/allocation/SquareTransactionPopover.tsx
git commit -m "feat(ui): SquareTransactionPopover with order siblings and totals"
```

---

### Task 5: Wire CostCentrePicker to Transaction + update ReviewTable

**Files:**
- Modify: `src/components/allocation/CostCentrePicker.tsx`
- Modify: `src/components/transactions/ReviewTable.tsx`

- [ ] **Step 1: Update CostCentrePicker props and auto-match logic**

In `src/components/allocation/CostCentrePicker.tsx`:

1. Change the import to include Transaction and SQUARE_CATEGORY_MAP:
```ts
import type { Transaction } from '@/lib/financialData'
import { COST_CENTRES, SQUARE_CATEGORY_MAP, COST_CENTRE_MAP, type CostCentre } from '@/lib/costCentres'
```

2. Replace the Props interface:
```ts
interface Props {
  transaction: Transaction          // full transaction (replaces individual string props)
  currentCode?: string
  onSelect: (code: string, label: string) => void
  disabled?: boolean
}
```

3. Update the component signature:
```ts
export default function CostCentrePicker({
  transaction,
  currentCode,
  onSelect,
  disabled = false,
}: Props) {
```

4. Update the `aiSuggestCostCentres` call in the useEffect (replace all three individual props with transaction):
```ts
useEffect(() => {
  if (!transaction.description) return

  let cancelled = false
  setLoading(true)

  aiSuggestCostCentres(transaction)
    .then(results => {
      if (!cancelled) setSuggestions(results)
    })
    .finally(() => {
      if (!cancelled) setLoading(false)
    })

  return () => { cancelled = true }
}, [transaction.description, transaction.amount, transaction.source,
    transaction.squareCategory, transaction.squareItemName])
```

5. After the suggestion pills, add the auto-match label when the top suggestion is a Square auto-match:
```tsx
{suggestions.length > 0 && suggestions[0].reason === 'Auto-matched via Square' && (
  <p style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic', marginTop: '2px' }}>
    Auto-matched via Square
  </p>
)}
```

- [ ] **Step 2: Update ReviewTable to pass full transaction and add popover**

In `src/components/transactions/ReviewTable.tsx`:

1. Add imports:
```ts
import SquareTransactionPopover from '@/components/allocation/SquareTransactionPopover'
```

2. Add hover state to the component:
```ts
const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

3. Change the CostCentrePicker usage from individual props to full transaction:
```tsx
<CostCentrePicker
  transaction={t}
  currentCode={t.status === 'confirmed' ? t.accountCode : undefined}
  onSelect={(code: string) => handleSelect(i, code)}
  disabled={t.status === 'confirmed'}
/>
```

4. Wrap the description `<td>` in a relative container and add popover trigger:
```tsx
<td
  className="px-4 py-3 max-w-xs"
  style={{ color: 'var(--text-1)', position: 'relative' }}
  onMouseEnter={() => {
    if (t.source === 'square') {
      hoverTimerRef.current = setTimeout(() => setHoveredIdx(i), 200)
    }
  }}
  onMouseLeave={() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredIdx(null)
  }}
>
  <span className="block truncate">{t.description}</span>
  {t.source === 'square' && hoveredIdx === i && (
    <SquareTransactionPopover
      transaction={t}
      allTransactions={transactions}
    />
  )}
</td>
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/allocation/CostCentrePicker.tsx src/components/transactions/ReviewTable.tsx
git commit -m "feat(ui): wire Square transaction context into CostCentrePicker and ReviewTable popover"
```

---

### Task 6: Final integration verification

- [ ] **Step 1: Run full test suite one more time**

```bash
npx vitest run
```

Expected output:
```
Test Files  6 passed (6)
Tests      XX passed
```

All test files should pass: categoriser.test.ts, csvParser.test.ts, financialData.test.ts, api.test.ts (Square), orderGroups.test.ts, auth.test.ts (Reckon)

- [ ] **Step 2: TypeScript clean build**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors)

- [ ] **Step 3: Manual smoke test**

With `npm run dev` running:
1. Go to `http://localhost:3000/transactions`
2. Upload `public/fixtures/sample-jan-2026-reckon.csv`
3. Verify: transactions load, CostCentrePicker shows suggestions, no console errors
4. Hover a non-Square row: no popover should appear
5. (For Square data: call `GET /api/square/payments?from=2026-03-01T00:00:00Z&to=2026-03-31T23:59:59Z` in DevTools to confirm the new `squareCategory` field is present in the JSON response)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(square): complete Square allocation integration — auto-match, popover, AI signals"
```

---

## Self-review notes

**Spec coverage check:**
- ✅ Task 1: transforms.ts populates orderId, squareCategory, squareItemName, squareItemId
- ✅ Task 2: SQUARE_CATEGORY_MAP covers all 19 known Square categories; suggestCostCentres prioritises Square signals
- ✅ Task 2: aiSuggestCostCentres skips AI call when Square map match exists (cost saving)
- ✅ Task 2: /api/ai-categorise includes squareCategoryMap in Claude prompt
- ✅ Task 3: orderGroups.ts with groupByOrder, getOrderSiblings, getOrderTotal
- ✅ Task 4: SquareTransactionPopover with order siblings, totals, design tokens
- ✅ Task 5: CostCentrePicker shows "Auto-matched via Square" label; accepts full Transaction
- ✅ Task 5: ReviewTable passes full transaction; popover triggers on hover with 200ms delay
- ✅ Reconciliation gate not modified (spec constraint)
- ✅ No new npm packages used
- ✅ All Square data read-only

**Correction from spec:** `src/app/allocation/page.tsx` does not exist. The actual allocation page is `src/app/transactions/page.tsx`. No changes to this file are needed in this plan — the ReviewTable already handles popover rendering at the row level.

**Type consistency check:**
- `suggestCostCentres(transaction: Transaction)` — used identically in Tasks 2 and 5 ✅
- `aiSuggestCostCentres(transaction: Transaction)` — used identically in Tasks 2 and 5 ✅
- `CostCentrePicker` prop `transaction: Transaction` — defined Task 5, used Task 5 ✅
- `getOrderSiblings(transaction, allTransactions)` — defined Task 3, used Task 4 ✅
- `SQUARE_CATEGORY_MAP` exported from `costCentres.ts` — used in Tasks 2 and 5 ✅
