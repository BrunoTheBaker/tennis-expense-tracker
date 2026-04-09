import type { Transaction } from '@/lib/financialData'

/** Per-source loading status. */
export type SourceStatus =
  | 'ok'
  | 'not_configured'   // env vars not set
  | 'auth_required'    // OAuth not done
  | 'error'            // fetch or API failure

export interface PeriodCache {
  periodKey:    string
  transactions: Transaction[]
  loadedAt:     string  // ISO 8601 — must be string, not Date, for JSON serialisation
  sources: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
}

const CACHE_PREFIX = 'sbtc_cache_'
const ACTIVE_KEY   = 'sbtc_active_period'

function storage(): Storage | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

export function getCachedPeriod(periodKey: string): PeriodCache | null {
  const raw = storage()?.getItem(CACHE_PREFIX + periodKey) ?? null
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (
      typeof parsed !== 'object' || parsed === null ||
      !('periodKey' in parsed) || !('sources' in parsed) || !('transactions' in parsed)
    ) return null
    return parsed as PeriodCache
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
