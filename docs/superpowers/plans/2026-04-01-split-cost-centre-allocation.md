# Split Cost Centre Allocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the treasurer split a single transaction across multiple cost centres, each with its own amount and percentage, via a modal triggered from the allocation table.

**Architecture:** Four layers built bottom-up: (1) extend Transaction with split types and extract pure split logic into a testable utility; (2) create SplitBadge (read-only pill summary) and SplitAllocationModal (editing); (3) wire ReviewTable to show Split button on hover and render the modal; (4) update ReconciliationGate to expand split transactions in the breakdown.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Tailwind CSS 3, Vitest 2 (`environment: 'node'`)

> **Note on CostCentrePicker API:** This plan is written against the current `CostCentrePicker` props (individual strings: `transactionDescription`, `transactionAmount`, `transactionSource`). If the Square Allocation Integration plan (`2026-04-01-square-allocation-integration.md`) has already been merged, `CostCentrePicker` now accepts `transaction: Transaction` — update the modal's picker call in Task 3 accordingly.

---

## Codebase orientation (read before starting)

- **Transaction type + helpers**: `src/lib/financialData.ts:3-14` — `AllocationSplit` and the two new optional fields go here. Import `CostCentre` from `./costCentres` (no circular dep risk).
- **CostCentre type**: `src/lib/costCentres.ts:11-17` — fields: `id`, `label`, `ledgerCode`, `category`, `keywords`.
- **CostCentrePicker**: `src/components/allocation/CostCentrePicker.tsx` — currently takes `transactionDescription`, `transactionAmount`, `transactionSource`, `currentCode`, `onSelect`, `disabled`. Used in modal split rows.
- **ReviewTable**: `src/components/transactions/ReviewTable.tsx` — 136 lines. Renders one `CostCentrePicker` per row. Needs hover state, Split button, SplitBadge, modal.
- **ReconciliationGate**: `src/components/allocation/ReconciliationGate.tsx` — groups confirmed transactions by `t.accountCode`. Needs to expand split transactions.
- **Modal pattern**: See `ReconciliationGate.tsx:51-99` — `fixed inset-0 z-50 flex items-center justify-center` overlay + `card w-full max-w-lg` container. Follow this pattern.
- **CSS classes in use**: `.btn-primary`, `.btn-secondary`, `.input-field`, `.card`, `.section-label`. Design tokens: `--text-1/2/3`, `--border`, `--surface`, `--brand`, `--green`.
- **Allocation page**: `src/app/transactions/page.tsx` — note: spec says `allocation/page.tsx` but this file does not exist. Actual file is `transactions/page.tsx`. No changes needed there for this feature.
- **No `src/types/index.ts`** — the spec mentions this path but it doesn't exist. Use `src/lib/financialData.ts` for all types.

---

## File map

**Create:**
- `src/lib/splitAllocation.ts` — pure split logic: `SplitRow` type, `createInitialSplits`, `addSplitRow`, `removeSplitRow`, `updateSplitAmount`, `updateSplitPercentage`, `totalAllocated`, `validateSplits`
- `src/lib/__tests__/splitAllocation.test.ts` — unit tests for all logic functions
- `src/components/allocation/SplitBadge.tsx` — compact read-only pill summary
- `src/components/allocation/SplitAllocationModal.tsx` — editing modal

**Modify:**
- `src/lib/financialData.ts` — add `AllocationSplit` interface + `splits?` and `isSplit?` to `Transaction`
- `src/components/transactions/ReviewTable.tsx` — add hover state, Split button, SplitBadge, modal rendering, `handleSplitConfirm`
- `src/components/allocation/ReconciliationGate.tsx` — expand split transactions in the breakdown

---

### Task 1: AllocationSplit type + pure split logic

**Files:**
- Modify: `src/lib/financialData.ts`
- Create: `src/lib/splitAllocation.ts`
- Create: `src/lib/__tests__/splitAllocation.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/splitAllocation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  createInitialSplits,
  addSplitRow,
  removeSplitRow,
  updateSplitAmount,
  updateSplitPercentage,
  totalAllocated,
  validateSplits,
  type SplitRow,
} from '@/lib/splitAllocation'
import type { CostCentre } from '@/lib/costCentres'

const TOTAL = 500

const CC: CostCentre = {
  id: '4-0200', ledgerCode: '4-0200', label: 'Social Sessions',
  category: 'Social Sessions', keywords: [],
}

function makeRow(amount: number, cc: CostCentre | null = CC): SplitRow {
  return { costCentre: cc, amount, percentage: (amount / TOTAL) * 100 }
}

describe('createInitialSplits', () => {
  it('returns 2 rows that sum to total', () => {
    const splits = createInitialSplits(500)
    expect(splits).toHaveLength(2)
    expect(totalAllocated(splits)).toBeCloseTo(500)
  })

  it('sets each row to 50% of total', () => {
    const splits = createInitialSplits(500)
    expect(splits[0].percentage).toBeCloseTo(50)
    expect(splits[1].percentage).toBeCloseTo(50)
  })

  it('costCentre is null for both rows', () => {
    const splits = createInitialSplits(500)
    expect(splits[0].costCentre).toBeNull()
    expect(splits[1].costCentre).toBeNull()
  })
})

describe('totalAllocated', () => {
  it('sums all split amounts', () => {
    const splits = [makeRow(300), makeRow(200)]
    expect(totalAllocated(splits)).toBeCloseTo(500)
  })
})

describe('validateSplits', () => {
  it('returns true when splits sum to total and all have cost centres', () => {
    const splits = [makeRow(300), makeRow(200)]
    expect(validateSplits(splits, 500)).toBe(true)
  })

  it('returns false when splits do not sum to total', () => {
    const splits = [makeRow(300), makeRow(100)]
    expect(validateSplits(splits, 500)).toBe(false)
  })

  it('returns false when a split has no cost centre', () => {
    const splits = [makeRow(300), makeRow(200, null)]
    expect(validateSplits(splits, 500)).toBe(false)
  })

  it('allows ±$0.01 tolerance for floating point', () => {
    const splits = [makeRow(333.33), makeRow(166.68)]  // sums to 500.01
    expect(validateSplits(splits, 500)).toBe(true)
  })

  it('returns false when over-allocation exceeds tolerance', () => {
    const splits = [makeRow(300), makeRow(201)]  // sums to 501
    expect(validateSplits(splits, 500)).toBe(false)
  })
})

describe('addSplitRow', () => {
  it('initialises new row to remaining unallocated amount', () => {
    const splits = [makeRow(300), makeRow(100)]  // 400 allocated of 500
    const updated = addSplitRow(splits, TOTAL)
    expect(updated).toHaveLength(3)
    expect(updated[2].amount).toBeCloseTo(100)
    expect(updated[2].percentage).toBeCloseTo(20)
  })

  it('does not exceed 5 splits', () => {
    const splits = [makeRow(100), makeRow(100), makeRow(100), makeRow(100), makeRow(100)]
    const updated = addSplitRow(splits, TOTAL)
    expect(updated).toHaveLength(5)
  })

  it('initialises to 0 when already fully allocated', () => {
    const splits = [makeRow(300), makeRow(200)]
    const updated = addSplitRow(splits, TOTAL)
    expect(updated[2].amount).toBe(0)
  })
})

describe('removeSplitRow', () => {
  it('removes the row at the given index', () => {
    const splits = [makeRow(300), makeRow(100), makeRow(100)]
    const updated = removeSplitRow(splits, 1)
    expect(updated).toHaveLength(2)
    expect(updated[0].amount).toBe(300)
    expect(updated[1].amount).toBe(100)
  })

  it('does not remove when only 2 splits remain', () => {
    const splits = [makeRow(300), makeRow(200)]
    const updated = removeSplitRow(splits, 0)
    expect(updated).toHaveLength(2)
  })
})

describe('updateSplitAmount', () => {
  it('updates amount and recalculates percentage', () => {
    const splits = [makeRow(250), makeRow(250)]
    const updated = updateSplitAmount(splits, 0, 300, TOTAL)
    expect(updated[0].amount).toBe(300)
    expect(updated[0].percentage).toBeCloseTo(60)
    expect(updated[1].amount).toBe(250)  // other rows unchanged
  })
})

describe('updateSplitPercentage', () => {
  it('updates percentage and recalculates amount', () => {
    const splits = [makeRow(250), makeRow(250)]
    const updated = updateSplitPercentage(splits, 0, 40, TOTAL)
    expect(updated[0].percentage).toBe(40)
    expect(updated[0].amount).toBeCloseTo(200)
    expect(updated[1].amount).toBe(250)  // other rows unchanged
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd C:/Users/Rory/Projects/tennis-treasury
npx vitest run src/lib/__tests__/splitAllocation.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/splitAllocation'`

- [ ] **Step 3: Create splitAllocation.ts**

Create `src/lib/splitAllocation.ts`:

```ts
import type { CostCentre } from './costCentres'

export interface SplitRow {
  costCentre: CostCentre | null
  amount: number
  percentage: number
  note?: string
}

const MAX_SPLITS = 5
const MIN_SPLITS = 2
const TOLERANCE = 0.01

/** Creates the initial 2-row state for the modal, split 50/50. */
export function createInitialSplits(total: number): SplitRow[] {
  const half = Math.round((total / 2) * 100) / 100
  return [
    { costCentre: null, amount: half, percentage: 50 },
    { costCentre: null, amount: Math.round((total - half) * 100) / 100, percentage: 50 },
  ]
}

/** Sum of all split amounts. */
export function totalAllocated(splits: SplitRow[]): number {
  return splits.reduce((sum, s) => sum + s.amount, 0)
}

/**
 * Returns true if all splits have a cost centre AND the amounts
 * sum to total within ±$0.01 floating-point tolerance.
 */
export function validateSplits(splits: SplitRow[], total: number): boolean {
  if (!splits.every(s => s.costCentre !== null)) return false
  return Math.abs(totalAllocated(splits) - total) <= TOLERANCE
}

/**
 * Adds a new split row. The new row is initialised to the remaining
 * unallocated amount. No-ops if already at MAX_SPLITS.
 */
export function addSplitRow(splits: SplitRow[], total: number): SplitRow[] {
  if (splits.length >= MAX_SPLITS) return splits
  const remaining = Math.max(0, Math.round((total - totalAllocated(splits)) * 100) / 100)
  const pct = total > 0 ? Math.round((remaining / total) * 10000) / 100 : 0
  return [...splits, { costCentre: null, amount: remaining, percentage: pct }]
}

/**
 * Removes the split at idx. No-ops if this would drop below MIN_SPLITS.
 * Does not redistribute amounts — leaves the remaining rows unchanged.
 */
export function removeSplitRow(splits: SplitRow[], idx: number): SplitRow[] {
  if (splits.length <= MIN_SPLITS) return splits
  return splits.filter((_, i) => i !== idx)
}

/** Updates the amount at idx and recalculates its percentage. Other rows unchanged. */
export function updateSplitAmount(splits: SplitRow[], idx: number, amount: number, total: number): SplitRow[] {
  return splits.map((s, i) => {
    if (i !== idx) return s
    const pct = total > 0 ? Math.round((amount / total) * 10000) / 100 : 0
    return { ...s, amount, percentage: pct }
  })
}

/** Updates the percentage at idx and recalculates its amount. Other rows unchanged. */
export function updateSplitPercentage(splits: SplitRow[], idx: number, pct: number, total: number): SplitRow[] {
  return splits.map((s, i) => {
    if (i !== idx) return s
    const amount = Math.round((pct / 100) * total * 100) / 100
    return { ...s, percentage: pct, amount }
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/splitAllocation.test.ts
```

Expected: all 17 tests PASS

- [ ] **Step 5: Add AllocationSplit + extend Transaction**

In `src/lib/financialData.ts`, add the import and new types at the top of the file (after the existing comment line):

```ts
import type { CostCentre } from './costCentres'

export interface AllocationSplit {
  costCentre: CostCentre
  amount: number        // must sum to transaction.amount
  percentage: number    // calculated automatically, 0–100
  note?: string         // optional description of this portion
}
```

Then in the `Transaction` interface, add two optional fields after `source?`:

```ts
  splits?: AllocationSplit[]  // set when isSplit is true
  isSplit?: boolean           // true when splits[] is populated instead of accountCode
```

- [ ] **Step 6: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/financialData.ts src/lib/splitAllocation.ts src/lib/__tests__/splitAllocation.test.ts
git commit -m "feat(split): AllocationSplit type + pure split logic utility with tests"
```

---

### Task 2: SplitBadge component

**Files:**
- Create: `src/components/allocation/SplitBadge.tsx`

No unit tests — pure presentational component.

- [ ] **Step 1: Create SplitBadge.tsx**

Create `src/components/allocation/SplitBadge.tsx`:

```tsx
'use client'

import type { AllocationSplit } from '@/lib/financialData'

interface Props {
  splits: AllocationSplit[]
  onEdit?: () => void
}

/**
 * Read-only compact summary of a split transaction.
 * Shows up to 2 split pills, "+N more" if there are more, and an
 * edit pencil that opens SplitAllocationModal when clicked.
 */
export default function SplitBadge({ splits, onEdit }: Props) {
  const visible = splits.slice(0, 2)
  const extraCount = splits.length - 2

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((s, i) => (
        <span
          key={i}
          className="text-xs font-medium px-2 py-0.5 rounded-full border"
          style={{
            color: 'var(--green)',
            background: '#f0fdf4',
            borderColor: '#bbf7d0',
          }}
        >
          {s.costCentre.label} · ${s.amount.toFixed(2)}
        </span>
      ))}

      {extraCount > 0 && (
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          +{extraCount} more
        </span>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs"
          style={{ color: 'var(--text-3)' }}
          title="Edit split"
          aria-label="Edit split allocation"
        >
          ✏
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/allocation/SplitBadge.tsx
git commit -m "feat(split): SplitBadge component — compact read-only split summary pills"
```

---

### Task 3: SplitAllocationModal component

**Files:**
- Create: `src/components/allocation/SplitAllocationModal.tsx`

- [ ] **Step 1: Create SplitAllocationModal.tsx**

Create `src/components/allocation/SplitAllocationModal.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { Transaction, AllocationSplit } from '@/lib/financialData'
import CostCentrePicker from '@/components/allocation/CostCentrePicker'
import type { CostCentre } from '@/lib/costCentres'
import {
  createInitialSplits,
  addSplitRow,
  removeSplitRow,
  updateSplitAmount,
  updateSplitPercentage,
  totalAllocated,
  validateSplits,
  type SplitRow,
} from '@/lib/splitAllocation'

interface Props {
  transaction: Transaction
  initialSplits?: AllocationSplit[]
  onConfirm: (splits: AllocationSplit[]) => void
  onCancel: () => void
}

export default function SplitAllocationModal({
  transaction,
  initialSplits,
  onConfirm,
  onCancel,
}: Props) {
  const [splits, setSplits] = useState<SplitRow[]>(() =>
    initialSplits
      ? initialSplits.map(s => ({ costCentre: s.costCentre, amount: s.amount, percentage: s.percentage, note: s.note }))
      : createInitialSplits(transaction.amount)
  )

  // Track which field was last typed per row so the other becomes effectively read-only
  const [lastEdited, setLastEdited] = useState<Record<number, 'amount' | 'pct'>>({})

  const total = transaction.amount
  const allocated = totalAllocated(splits)
  const remaining = total - allocated
  const isOverAllocated = allocated > total + 0.01
  const isValid = validateSplits(splits, total)
  const fillPct = total > 0 ? Math.min(100, (allocated / total) * 100) : 0

  function handleAmountChange(i: number, raw: string) {
    const val = parseFloat(raw) || 0
    setSplits(prev => updateSplitAmount(prev, i, val, total))
    setLastEdited(prev => ({ ...prev, [i]: 'amount' }))
  }

  function handlePctChange(i: number, raw: string) {
    const val = parseFloat(raw) || 0
    setSplits(prev => updateSplitPercentage(prev, i, val, total))
    setLastEdited(prev => ({ ...prev, [i]: 'pct' }))
  }

  function handleCostCentreSelect(i: number, code: string, label: string) {
    setSplits(prev =>
      prev.map((s, idx) => {
        if (idx !== i) return s
        const cc: CostCentre = { id: code, ledgerCode: code, label, category: '', keywords: [] }
        return { ...s, costCentre: cc }
      })
    )
  }

  function handleAdd() {
    setSplits(prev => addSplitRow(prev, total))
  }

  function handleRemove(i: number) {
    setSplits(prev => removeSplitRow(prev, i))
    setLastEdited(prev => {
      const updated = { ...prev }
      delete updated[i]
      return updated
    })
  }

  function handleConfirm() {
    if (!isValid) return
    const confirmed: AllocationSplit[] = splits.map(s => ({
      costCentre: s.costCentre!,
      amount: s.amount,
      percentage: s.percentage,
      note: s.note,
    }))
    onConfirm(confirmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="card w-full"
        style={{ maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="font-semibold text-base mb-0.5" style={{ color: 'var(--text-1)' }}>
            Split allocation
          </h2>
          <p className="text-sm truncate" style={{ color: 'var(--text-3)' }}>
            {transaction.description}
          </p>
          <p
            className="text-sm font-semibold mt-1"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-dm-mono)' }}
          >
            Total: ${total.toFixed(2)}
          </p>
        </div>

        {/* Split rows */}
        <div className="space-y-3 mb-4">
          {splits.map((split, i) => (
            <div key={i} className="flex gap-2 items-start">
              {/* Cost centre picker */}
              <div className="flex-1 min-w-0">
                <CostCentrePicker
                  transactionDescription={transaction.description}
                  transactionAmount={split.amount}
                  transactionSource={transaction.source}
                  currentCode={split.costCentre?.ledgerCode}
                  onSelect={(code, label) => handleCostCentreSelect(i, code, label)}
                />
              </div>

              {/* Amount input */}
              <input
                type="number"
                min="0"
                step="0.01"
                value={split.amount || ''}
                readOnly={lastEdited[i] === 'pct'}
                onChange={e => handleAmountChange(i, e.target.value)}
                onFocus={() => setLastEdited(prev => ({ ...prev, [i]: 'amount' }))}
                className="input-field !py-1 !text-xs w-24 shrink-0"
                style={{ fontFamily: 'var(--font-dm-mono)', textAlign: 'right' }}
                placeholder="0.00"
                aria-label={`Split ${i + 1} amount`}
              />

              {/* Percentage input */}
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={split.percentage ? split.percentage.toFixed(1) : ''}
                readOnly={lastEdited[i] === 'amount'}
                onChange={e => handlePctChange(i, e.target.value)}
                onFocus={() => setLastEdited(prev => ({ ...prev, [i]: 'pct' }))}
                className="input-field !py-1 !text-xs w-16 shrink-0"
                style={{ fontFamily: 'var(--font-dm-mono)', textAlign: 'right' }}
                placeholder="0%"
                aria-label={`Split ${i + 1} percentage`}
              />

              {/* Remove button */}
              <button
                type="button"
                disabled={splits.length <= 2}
                onClick={() => handleRemove(i)}
                className="text-sm mt-1 shrink-0"
                style={{ color: splits.length <= 2 ? 'var(--text-3)' : 'var(--text-2)' }}
                aria-label={`Remove split ${i + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add split link */}
        {splits.length < 5 && (
          <button
            type="button"
            onClick={handleAdd}
            className="text-xs mb-4 block"
            style={{ color: 'var(--brand)' }}
          >
            + Add another split
          </button>
        )}

        {/* Progress bar */}
        <div
          className="mb-1 overflow-hidden"
          style={{ height: '6px', borderRadius: '3px', background: 'var(--border)' }}
        >
          <div
            style={{
              width: `${fillPct}%`,
              height: '100%',
              borderRadius: '3px',
              background: isOverAllocated ? '#dc2626' : '#1D9E75',
              transition: 'width 0.15s ease, background 0.15s ease',
            }}
          />
        </div>
        <p className="text-xs mb-4" style={{ color: isOverAllocated ? '#dc2626' : 'var(--text-3)' }}>
          ${allocated.toFixed(2)} of ${total.toFixed(2)} allocated
          {Math.abs(remaining) > 0.01 && (
            <span>
              {' · '}
              {remaining > 0
                ? `$${remaining.toFixed(2)} remaining`
                : `$${Math.abs(remaining).toFixed(2)} over`}
            </span>
          )}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!isValid} onClick={handleConfirm}>
            Confirm split
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/allocation/SplitAllocationModal.tsx
git commit -m "feat(split): SplitAllocationModal with bidirectional amount/percentage sync and progress bar"
```

---

### Task 4: Wire ReviewTable — hover button, modal, split badge

**Files:**
- Modify: `src/components/transactions/ReviewTable.tsx`

- [ ] **Step 1: Replace ReviewTable.tsx with the updated version**

Write the full file `src/components/transactions/ReviewTable.tsx`:

```tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import type { Transaction, AllocationSplit } from '@/lib/financialData'
import { accounts } from '@/lib/accounts'
import CostCentrePicker from '@/components/allocation/CostCentrePicker'
import SplitBadge from '@/components/allocation/SplitBadge'
import SplitAllocationModal from '@/components/allocation/SplitAllocationModal'

interface Props {
  transactions: Transaction[]
  onChange: (updated: Transaction[]) => void
}

export function ReviewTable({ transactions, onChange }: Props) {
  const [hoveredIdx, setHoveredIdx]       = useState<number | null>(null)
  const [splitModalIdx, setSplitModalIdx] = useState<number | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSelect = useCallback((i: number, code: string) => {
    const account = accounts.find(a => a.code === code)
    const updated = transactions.map((t, idx) =>
      idx === i
        ? { ...t, accountCode: code, isSplit: false, splits: undefined, status: 'confirmed' as const, confidence: 'high' as const }
        : t
    )
    onChange(updated)
    void account
  }, [transactions, onChange])

  const handleSplitConfirm = useCallback((i: number, splits: AllocationSplit[]) => {
    const updated = transactions.map((t, idx) =>
      idx === i
        ? { ...t, splits, isSplit: true, accountCode: undefined, status: 'confirmed' as const, confidence: 'high' as const }
        : t
    )
    onChange(updated)
    setSplitModalIdx(null)
  }, [transactions, onChange])

  const skip = useCallback((i: number) => {
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, status: 'skipped' as const } : t
    )
    onChange(updated)
  }, [transactions, onChange])

  const reopen = useCallback((i: number) => {
    const updated = transactions.map((t, idx) =>
      idx === i
        ? { ...t, accountCode: undefined, isSplit: false, splits: undefined, status: 'pending' as const }
        : t
    )
    onChange(updated)
  }, [transactions, onChange])

  function startHover(i: number) {
    hoverTimerRef.current = setTimeout(() => setHoveredIdx(i), 150)
  }

  function endHover() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredIdx(null)
  }

  const activeSplitTransaction = splitModalIdx !== null ? transactions[splitModalIdx] : null

  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>
        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        {' — '}
        {transactions.filter(t => t.status === 'confirmed').length} confirmed,{' '}
        {transactions.filter(t => t.status === 'pending').length} pending
      </p>

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead style={{ background: 'var(--bg)' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Date</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Description</th>
              <th className="px-4 py-3 text-right font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Amount</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Source</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Cost Centre</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t, i) => {
              const isDone    = t.status === 'confirmed' || t.status === 'skipped'
              const isHovered = hoveredIdx === i

              return (
                <tr
                  key={i}
                  className={isDone ? 'bg-gray-50' : 'hover:bg-blue-50'}
                  onMouseEnter={() => startHover(i)}
                  onMouseLeave={endHover}
                >
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                    {t.date}
                  </td>
                  <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--text-1)' }}>
                    <span className="block truncate">{t.description}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {t.amount >= 0 ? '+' : '−'}${Math.abs(t.amount).toFixed(2)}
                  </td>
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

                  {/* Cost centre cell */}
                  <td className="px-4 py-3">
                    {t.status === 'skipped' ? (
                      <span className="text-gray-400 italic text-xs">Skipped</span>
                    ) : t.isSplit && t.splits ? (
                      // Split transaction: show badge with edit button
                      <SplitBadge
                        splits={t.splits}
                        onEdit={t.status !== 'confirmed' || true ? () => setSplitModalIdx(i) : undefined}
                      />
                    ) : (
                      // Single allocation: picker + optional Split button on hover
                      <div className="flex items-start gap-2">
                        <CostCentrePicker
                          transactionDescription={t.description}
                          transactionAmount={t.amount}
                          transactionSource={t.source}
                          currentCode={t.status === 'confirmed' ? t.accountCode : undefined}
                          onSelect={(code: string) => handleSelect(i, code)}
                          disabled={t.status === 'confirmed'}
                        />
                        {isHovered && t.status !== 'confirmed' && (
                          <button
                            type="button"
                            className="btn-secondary text-xs whitespace-nowrap shrink-0 mt-1"
                            onClick={() => setSplitModalIdx(i)}
                          >
                            Split →
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      {t.status === 'confirmed' && (
                        <button
                          onClick={() => reopen(i)}
                          className="text-xs py-1 px-2 rounded border"
                          style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
                        >
                          Reassign
                        </button>
                      )}
                      {t.status === 'pending' && (
                        <button
                          onClick={() => skip(i)}
                          className="text-xs py-1 px-2 text-gray-400 hover:text-gray-600"
                        >
                          Skip
                        </button>
                      )}
                      {t.status === 'skipped' && (
                        <button
                          onClick={() => reopen(i)}
                          className="text-xs py-1 px-2 text-gray-400 hover:text-gray-600"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Split allocation modal */}
      {activeSplitTransaction && (
        <SplitAllocationModal
          transaction={activeSplitTransaction}
          initialSplits={activeSplitTransaction.isSplit ? activeSplitTransaction.splits : undefined}
          onConfirm={splits => handleSplitConfirm(splitModalIdx!, splits)}
          onCancel={() => setSplitModalIdx(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS (splitAllocation.test.ts + existing tests)

- [ ] **Step 4: Commit**

```bash
git add src/components/transactions/ReviewTable.tsx
git commit -m "feat(split): wire ReviewTable with Split hover button, SplitBadge, and modal"
```

---

### Task 5: Update ReconciliationGate for split transactions

**Files:**
- Modify: `src/components/allocation/ReconciliationGate.tsx`

The gate's `byCode` accumulator currently groups by `t.accountCode`. For split transactions (`t.isSplit && t.splits`), it must expand each split into its own line item using `s.costCentre.ledgerCode` and `s.costCentre.label` directly (no `accounts` lookup needed).

- [ ] **Step 1: Update the byCode accumulator in ReconciliationGate.tsx**

Replace the `byCode` reduce block (lines 25–31 in the current file) with:

```ts
  const byCode = confirmed.reduce<Record<string, { name: string; total: number }>>((acc, t) => {
    if (t.isSplit && t.splits && t.splits.length > 0) {
      for (const s of t.splits) {
        const code = s.costCentre.ledgerCode
        if (!acc[code]) acc[code] = { name: s.costCentre.label, total: 0 }
        acc[code].total += s.amount
      }
    } else {
      const code = t.accountCode ?? 'unassigned'
      const name = accounts.find(a => a.code === code)?.name ?? code
      if (!acc[code]) acc[code] = { name, total: 0 }
      acc[code].total += t.amount
    }
    return acc
  }, {})
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/allocation/ReconciliationGate.tsx
git commit -m "feat(split): expand split transactions in ReconciliationGate breakdown"
```

---

### Task 6: Final integration verification

- [ ] **Step 1: Full test suite**

```bash
npx vitest run
```

Expected:
```
Test Files  X passed
Tests       XX passed
```

All test files including `splitAllocation.test.ts` should pass.

- [ ] **Step 2: TypeScript clean build**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors)

- [ ] **Step 3: Manual smoke test**

With `npm run dev` running (port 3000):
1. Go to `http://localhost:3000/transactions`
2. Upload `public/fixtures/sample-jan-2026-reckon.csv`
3. On any pending row: hover the row — verify "Split →" button appears next to the picker
4. Click "Split →" — verify modal opens with correct description and total
5. Fill in two splits (e.g. $300 + $200 = $500) and pick cost centres for each
6. Verify progress bar fills green and Confirm button becomes active
7. Click Confirm — verify modal closes, row shows SplitBadge pills, row marked confirmed
8. Open ReconciliationGate — verify split transaction's amounts appear as separate line items
9. Click ✏ on a SplitBadge — verify modal reopens with existing splits pre-filled
10. Over-allocate intentionally (e.g. $300 + $250 on a $500 total) — verify bar turns red, Confirm stays disabled

- [ ] **Step 4: Final commit (if any stragglers)**

```bash
git add -A
git commit -m "feat(split): complete split cost centre allocation — modal, badge, ReviewTable, ReconciliationGate"
```

---

## Self-review notes

**Spec coverage check:**
- ✅ `SplitAllocationModal.tsx` — header, total display, 2–5 split rows, amount/pct bidirectional sync, progress bar, confirm/cancel
- ✅ `AllocationSplit` interface with costCentre, amount, percentage, note — in `financialData.ts`
- ✅ `Transaction` extended with `splits?` and `isSplit?` — in `financialData.ts`
- ✅ Split button on hover (150ms delay), only on pending rows — ReviewTable
- ✅ SplitBadge pills (top 2 + "+N more") with edit pencil — ReviewTable split rows
- ✅ CostCentrePicker wired in modal — each split row has its own picker
- ✅ Confirm disabled until splits sum to total ±$0.01 AND all have cost centres
- ✅ Progress bar: 6px, border-radius 3px, #1D9E75 fill, red (#dc2626) when over
- ✅ "Add another split" link, disabled at 5 splits
- ✅ Reconciliation gate breakdown expanded for split transactions
- ✅ `getTransactionCostCentre` logic for report totals: embedded in ReconciliationGate's `byCode` reducer
- ✅ No new npm packages
- ✅ Split action hidden by default (hover-only), non-intrusive to existing workflow

**Spec item addressed differently than written:**
- Spec mentions `src/types/index.ts` — this file doesn't exist. `AllocationSplit` goes in `src/lib/financialData.ts` where `Transaction` lives.
- Spec mentions `src/app/allocation/page.tsx` — this file doesn't exist. Actual page is `src/app/transactions/page.tsx`. No changes needed there.
- Spec says `getTransactionCostCentre` helper for `financialData.ts` — this function isn't needed as a standalone export; the logic is embedded in ReconciliationGate's `byCode` accumulator. Adding it as a standalone export would be YAGNI without a second call site.
- Component tests (`SplitAllocationModal.test.ts`) — no React Testing Library installed and `vitest.config.ts` uses `environment: 'node'`. The spec's test cases (sum validation, pct/amount sync, add/remove row) are covered by the pure logic tests in `splitAllocation.test.ts`.

**Type consistency check:**
- `AllocationSplit.costCentre: CostCentre` (defined Task 1) — used in SplitBadge (Task 2), SplitAllocationModal (Task 3), ReconciliationGate (Task 5) ✅
- `SplitRow.costCentre: CostCentre | null` (Task 1) — used in SplitAllocationModal (Task 3) ✅
- `validateSplits(splits, total)` (Task 1) — called in SplitAllocationModal (Task 3) ✅
- `Transaction.splits?: AllocationSplit[]` (Task 1) — read in ReviewTable (Task 4), ReconciliationGate (Task 5) ✅
- `Transaction.isSplit?: boolean` (Task 1) — read in ReviewTable (Task 4), ReconciliationGate (Task 5) ✅
- `handleSplitConfirm(i, splits)` (Task 4) — sets `isSplit: true`, `splits`, clears `accountCode` ✅
- `SplitBadge({ splits, onEdit })` (Task 2) — used in ReviewTable (Task 4) ✅
- `SplitAllocationModal({ transaction, initialSplits, onConfirm, onCancel })` (Task 3) — used in ReviewTable (Task 4) ✅
