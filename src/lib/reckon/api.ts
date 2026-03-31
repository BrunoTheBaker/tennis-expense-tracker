/**
 * Typed wrappers for Reckon One v2 endpoints.
 * All functions return empty arrays (never throw) so the app degrades
 * gracefully when credentials are not yet configured.
 *
 * // TODO: RECKON API — verify endpoint paths against live Swagger once credentials arrive.
 */

import { createReckonClient, RECKON_BOOK_ID } from './auth'
import type {
  ReckonTransaction,
  Account,
  BankAccount,
  LedgerEntry,
  PagedResponse,
} from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Returns all transactions for a book within the given date range.
 * // TODO: RECKON API — confirm pagination behaviour and max page size.
 */
export async function getTransactions(
  bookId: string = RECKON_BOOK_ID,
  from: Date,
  to: Date,
): Promise<ReckonTransaction[]> {
  try {
    const client = await createReckonClient()
    const params = new URLSearchParams({
      startDate: isoDate(from),
      endDate:   isoDate(to),
      pageSize:  '500',
    })
    const res = await client.get<PagedResponse<ReckonTransaction>>(
      `/books/${bookId}/transactions?${params}`
    )
    return res.data
  } catch (err) {
    console.warn('[Reckon] getTransactions failed:', err)
    return []
  }
}

/**
 * Returns the chart of accounts for a book.
 */
export async function getAccounts(
  bookId: string = RECKON_BOOK_ID,
): Promise<Account[]> {
  try {
    const client = await createReckonClient()
    const res = await client.get<PagedResponse<Account>>(
      `/books/${bookId}/accounts?pageSize=500`
    )
    return res.data
  } catch (err) {
    console.warn('[Reckon] getAccounts failed:', err)
    return []
  }
}

/**
 * Returns bank/cash accounts with current balances.
 */
export async function getBankAccounts(
  bookId: string = RECKON_BOOK_ID,
): Promise<BankAccount[]> {
  try {
    const client = await createReckonClient()
    const res = await client.get<PagedResponse<BankAccount>>(
      `/books/${bookId}/bankaccounts?pageSize=100`
    )
    return res.data
  } catch (err) {
    console.warn('[Reckon] getBankAccounts failed:', err)
    return []
  }
}

/**
 * Returns general ledger detail entries for the given date range.
 * // TODO: RECKON API — confirm the ledger report endpoint path.
 */
export async function getLedgerReport(
  bookId: string = RECKON_BOOK_ID,
  from: Date,
  to: Date,
): Promise<LedgerEntry[]> {
  try {
    const client = await createReckonClient()
    const params = new URLSearchParams({
      startDate: isoDate(from),
      endDate:   isoDate(to),
    })
    const res = await client.get<PagedResponse<LedgerEntry>>(
      `/books/${bookId}/reports/generalledger?${params}`
    )
    return res.data
  } catch (err) {
    console.warn('[Reckon] getLedgerReport failed:', err)
    return []
  }
}
