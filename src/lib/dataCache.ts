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
  } catch (err) {
    console.warn('[dataCache] sessionStorage write failed for period', cache.periodKey, err)
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
