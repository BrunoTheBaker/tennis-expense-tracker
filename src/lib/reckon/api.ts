/**
 * Typed wrappers for Reckon One v2 endpoints.
 *
 * Base URL (in client.ts): https://api.reckon.com/r1/v2/{bookId}
 * All endpoint paths below are relative to that base.
 *
 * All functions catch errors, console.warn, and return [] or null so
 * the app degrades gracefully when Reckon is unavailable.
 *
 * NOTE: Reckon v2 response shapes use `items` for list endpoints.
 * If the live API uses a different key (e.g. `value` or `data`),
 * update the extractItems() helper below.
 */

import { reckonFetch } from './client'
import type { ReckonTransaction, ReckonAccount, ReckonBankBalance, ReckonPnL } from './types'

// ─── Response extraction ──────────────────────────────────────────────────────

/**
 * Extracts item array from common Reckon v2 response shapes.
 * Handles: { items: [...] }, { value: [...] }, { data: [...] }, or [...]
 */
function extractItems<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[]
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>
    if (Array.isArray(r.items))  return r.items  as T[]
    if (Array.isArray(r.value))  return r.value  as T[]
    if (Array.isArray(r.data))   return r.data   as T[]
  }
  return []
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Returns ledger transactions for the given ISO 8601 date range.
 * Uses OData $filter on transactionDate.
 */
export async function getLedgerTransactions(
  from: string,
  to: string,
): Promise<ReckonTransaction[]> {
  try {
    const filter = `transactionDate ge '${from}' and transactionDate le '${to}'`
    const params = new URLSearchParams({ filter })
    const res = await reckonFetch<unknown>(`/transactions?${params.toString()}`)
    return extractItems<ReckonTransaction>(res)
  } catch (err) {
    console.warn('[Reckon] getLedgerTransactions failed:', err)
    return []
  }
}

/**
 * Returns the chart of accounts.
 */
export async function getAccounts(): Promise<ReckonAccount[]> {
  try {
    const res = await reckonFetch<unknown>('/ledgeraccounts')
    return extractItems<ReckonAccount>(res)
  } catch (err) {
    console.warn('[Reckon] getAccounts failed:', err)
    return []
  }
}

/**
 * Returns bank/cash accounts with current balances.
 */
export async function getBankBalances(): Promise<ReckonBankBalance[]> {
  try {
    const res = await reckonFetch<unknown>('/bankaccounts')
    return extractItems<ReckonBankBalance>(res)
  } catch (err) {
    console.warn('[Reckon] getBankBalances failed:', err)
    return []
  }
}

/**
 * Returns a Profit & Loss summary for the date range.
 * Returns null on error rather than throwing.
 */
export async function getProfitAndLoss(
  from: string,
  to: string,
): Promise<ReckonPnL | null> {
  try {
    const params = new URLSearchParams({ startDate: from, endDate: to })
    const res = await reckonFetch<ReckonPnL>(`/reports/profitandloss?${params.toString()}`)
    return res
  } catch (err) {
    console.warn('[Reckon] getProfitAndLoss failed:', err)
    return null
  }
}
