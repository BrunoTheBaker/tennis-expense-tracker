import type { Transaction } from '@/lib/financialData'

export interface LoadResult {
  transactions: Transaction[]
  sources: { square: boolean; reckon: boolean; stripe: boolean }
}

// TODO: update when financial year rolls over (currently Mar 2025 – Feb 2026)
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
  if (!mon || Number.isNaN(year) || !(mon in MONTH_INDEX)) {
    throw new Error(`Unknown period key: "${periodKey}"`)
  }
  const monthIndex = MONTH_INDEX[mon]
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999))
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
