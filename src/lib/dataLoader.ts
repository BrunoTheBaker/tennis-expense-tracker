import type { Transaction } from '@/lib/financialData'
import type { SourceStatus } from './dataCache'
import { periodToDateRange } from '@/lib/periods'


export interface LoadResult {
  transactions: Transaction[]
  sources: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
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
    const data = await res.json()
    if (!Array.isArray(data)) return { txns: [], status: 'error' }
    return { txns: data as Transaction[], status: 'ok' }
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
