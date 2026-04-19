import 'server-only'

/**
 * Typed wrappers for Reckon One v2 endpoints.
 *
 * Base URL (in client.ts): https://api.reckon.com/r1/v2/{bookId}
 * All endpoint paths below are relative to that base.
 *
 * All functions catch errors, console.warn, and return [] or null so
 * the app degrades gracefully when Reckon is unavailable.
 */

import { reckonFetch } from './client'
import type { ReckonTransaction, ReckonAccount, ReckonBankBalance, ReckonPnL, Account, BankAccount, LedgerEntry } from './types'

// ─── Response extraction ──────────────────────────────────────────────────────

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

export async function getLedgerTransactions(from: string, to: string): Promise<ReckonTransaction[]> {
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

export async function getAccounts(): Promise<ReckonAccount[]> {
  try {
    const res = await reckonFetch<unknown>('/ledgeraccounts')
    return extractItems<ReckonAccount>(res)
  } catch (err) {
    console.warn('[Reckon] getAccounts failed:', err)
    return []
  }
}

export async function getBankBalances(): Promise<ReckonBankBalance[]> {
  try {
    const res = await reckonFetch<unknown>('/bankaccounts')
    return extractItems<ReckonBankBalance>(res)
  } catch (err) {
    console.warn('[Reckon] getBankBalances failed:', err)
    return []
  }
}

export async function getProfitAndLoss(from: string, to: string): Promise<ReckonPnL | null> {
  try {
    const params = new URLSearchParams({ startDate: from, endDate: to })
    const res = await reckonFetch<ReckonPnL>(`/reports/profitandloss?${params.toString()}`)
    return res
  } catch (err) {
    console.warn('[Reckon] getProfitAndLoss failed:', err)
    return null
  }
}

// ─── Legacy aliases for the generic proxy route ───────────────────────────────
// These match the old function signatures used by /api/reckon/[endpoint].

export async function getTransactions(_bookId: string | undefined, from: Date, to: Date) {
  return getLedgerTransactions(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10))
}

export async function getLedgerReport(_bookId: string | undefined, from: Date, to: Date) {
  return getLedgerTransactions(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10))
}

export async function getBankAccounts(_bookId?: string): Promise<BankAccount[]> {
  const balances = await getBankBalances()
  // Map ReckonBankBalance to BankAccount shape for backwards compatibility
  return balances.map(b => ({
    id:            b.id,
    accountId:     b.id,
    accountCode:   '',
    name:          b.name,
    balance:       b.balance,
    currency:      b.currency,
  }))
}

// Re-export getAccounts with a bookId param signature for the proxy route
export { getAccounts as getAccountsLegacy }
export type { Account, BankAccount, LedgerEntry }
