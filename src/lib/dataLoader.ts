import type { Transaction } from '@/lib/financialData'
import type { SourceStatus } from './dataCache'

export interface LoadResult {
  transactions: Transaction[]
  sources: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
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
  const year       = Number(yr)
  const monthIndex = MONTH_INDEX[mon] ?? 0
  // Day 0 of next month = last day of this month
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

// ─── Source fetchers ──────────────────────────────────────────────────────────

async function fetchSquare(from: string, to: string): Promise<{ txns: Transaction[]; status: SourceStatus }> {
  try {
    const params = new URLSearchParams({ from, to })
    const res = await fetch(`/api/square/payments?${params}`)
    if (!res.ok) return { txns: [], status: 'error' }
    const data = await res.json() as Transaction[]
    return { txns: data, status: 'ok' }
  } catch {
    return { txns: [], status: 'error' }
  }
}

async function fetchReckon(from: string, to: string): Promise<{ txns: Transaction[]; status: SourceStatus }> {
  try {
    const params = new URLSearchParams({ from, to })
    const res = await fetch(`/api/reckon/transactions?${params}`)

    if (res.status === 401) {
      const body = await res.json().catch(() => ({}) as Record<string, unknown>)
      const s = (body as Record<string, unknown>).status
      if (s === 'auth_required') return { txns: [], status: 'auth_required' }
      return { txns: [], status: 'error' }
    }

    if (!res.ok) return { txns: [], status: 'error' }

    const body = await res.json() as { data?: Transaction[]; status?: string; _mock?: boolean }

    if (body.status === 'not_configured') return { txns: [], status: 'not_configured' }

    return { txns: body.data ?? [], status: 'ok' }
  } catch {
    return { txns: [], status: 'error' }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadPeriodData(periodKey: string): Promise<LoadResult> {
  const { from, to } = periodToDateRange(periodKey)

  const [squareResult, reckonResult] = await Promise.all([
    fetchSquare(from, to),
    fetchReckon(from, to),
  ])

  return {
    transactions: dedup([...squareResult.txns, ...reckonResult.txns]),
    sources: {
      square: squareResult.status,
      reckon: reckonResult.status,
      stripe: 'not_configured',
    },
  }
}
