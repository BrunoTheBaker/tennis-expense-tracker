/**
 * Server-only write layer for Reckon One.
 * Posts accepted transactions to the Reckon ledger sequentially.
 *
 * Safety rules enforced here — never relax these:
 *   - NEVER post source === 'reckon'  (already in Reckon)
 *   - NEVER post postedToReckon === true  (duplicate guard)
 *   - NEVER post a non-split transaction with no accountCode
 *   - Log every PostResult regardless of success/failure
 */
import 'server-only'

import { createReckonClient, RECKON_BOOK_ID } from './auth'
import { getAccountsWithCache } from './accountCache'
import type { Transaction } from '@/lib/financialData'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostResult {
  transactionId: string   // transaction.reference
  status: 'success' | 'failed' | 'skipped'
  reckonId?: string       // id returned by Reckon on success
  error?: string
}

interface ReckonPostBody {
  transactionDate: string
  description: string
  reference: string
  amount: number
  accountId: string
  type: 'credit' | 'debit'
}

interface ReckonPostResponse {
  id: string
  [key: string]: unknown
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts DD/MM/YYYY → YYYY-MM-DD for the Reckon API. */
function toIsoDate(date: string): string {
  const [day, month, year] = date.split('/')
  return `${year}-${month}-${day}`
}

function log(result: PostResult) {
  const ts = new Date().toISOString()
  console.log(`[Reckon:write] ${ts} | ${result.status.toUpperCase()} | ${result.transactionId}${result.reckonId ? ` → ${result.reckonId}` : ''}${result.error ? ` | ${result.error}` : ''}`)
}

// ─── Core: single transaction ─────────────────────────────────────────────────

/**
 * Posts a single transaction to Reckon One.
 * Never throws — always returns a PostResult.
 */
export async function postTransaction(transaction: Transaction): Promise<PostResult> {
  const id = transaction.reference || `${transaction.date}-${transaction.description}`

  // ── Safety guards ───────────────────────────────────────────────────────────
  if (transaction.source === 'reckon') {
    const result: PostResult = { transactionId: id, status: 'skipped', error: 'Source is reckon — already in Reckon, skipping' }
    log(result)
    return result
  }

  if (transaction.postedToReckon === true) {
    const result: PostResult = { transactionId: id, status: 'skipped', error: 'Already posted to Reckon (duplicate guard)' }
    log(result)
    return result
  }

  if (!transaction.isSplit && !transaction.accountCode) {
    const result: PostResult = { transactionId: id, status: 'failed', error: 'No accountCode assigned — cannot post without a cost centre' }
    log(result)
    return result
  }

  // ── Split transaction ───────────────────────────────────────────────────────
  if (transaction.isSplit && transaction.splits?.length) {
    return postSplitTransaction(transaction)
  }

  // ── Standard (single) transaction ───────────────────────────────────────────
  try {
    const accounts = await getAccountsWithCache()
    const account  = accounts.find(a => a.code === transaction.accountCode)

    if (!account) {
      const result: PostResult = {
        transactionId: id,
        status:        'failed',
        error:         `No matching Reckon account for cost centre: ${transaction.accountCode}`,
      }
      log(result)
      return result
    }

    const client  = await createReckonClient()
    const body: ReckonPostBody = {
      transactionDate: toIsoDate(transaction.date),
      description:     transaction.description,
      reference:       `SQ-${id}`,
      amount:          Math.abs(transaction.amount),
      accountId:       account.id,
      type:            transaction.amount >= 0 ? 'credit' : 'debit',
    }

    const response = await client.post<ReckonPostResponse>(
      `/books/${RECKON_BOOK_ID}/transactions`,
      body,
    )

    const result: PostResult = { transactionId: id, status: 'success', reckonId: response.id }
    log(result)
    return result

  } catch (err) {
    const result: PostResult = {
      transactionId: id,
      status:        'failed',
      error:         err instanceof Error ? err.message : String(err),
    }
    log(result)
    return result
  }
}

/**
 * Posts one Reckon transaction per split, each with a suffixed reference.
 * Returns a single PostResult — success only if ALL splits succeed.
 */
async function postSplitTransaction(transaction: Transaction): Promise<PostResult> {
  const id       = transaction.reference || `${transaction.date}-${transaction.description}`
  const splits   = transaction.splits!
  const accounts = await getAccountsWithCache()
  const client   = await createReckonClient()

  const reckonIds: string[] = []

  for (let i = 0; i < splits.length; i++) {
    const split   = splits[i]
    const account = accounts.find(a => a.code === split.accountCode)

    if (!account) {
      const result: PostResult = {
        transactionId: id,
        status:        'failed',
        error:         `Split ${i + 1}: no matching Reckon account for cost centre: ${split.accountCode}`,
      }
      log(result)
      return result
    }

    try {
      const body: ReckonPostBody = {
        transactionDate: toIsoDate(transaction.date),
        description:     transaction.description,
        reference:       `SQ-${id}-${i + 1}`,
        amount:          Math.abs(split.amount),
        accountId:       account.id,
        type:            split.amount >= 0 ? 'credit' : 'debit',
      }
      const response = await client.post<ReckonPostResponse>(
        `/books/${RECKON_BOOK_ID}/transactions`,
        body,
      )
      reckonIds.push(response.id)
    } catch (err) {
      const result: PostResult = {
        transactionId: id,
        status:        'failed',
        error:         `Split ${i + 1}: ${err instanceof Error ? err.message : String(err)}`,
      }
      log(result)
      return result
    }
  }

  const result: PostResult = { transactionId: id, status: 'success', reckonId: reckonIds.join(',') }
  log(result)
  return result
}

// ─── Batch ────────────────────────────────────────────────────────────────────

/**
 * Posts a batch of transactions sequentially.
 * Continues after any single failure. Never throws.
 * Returns one PostResult per input transaction.
 */
export async function postTransactionBatch(
  transactions: Transaction[],
): Promise<PostResult[]> {
  const results: PostResult[] = []

  for (const transaction of transactions) {
    const result = await postTransaction(transaction)
    results.push(result)
  }

  return results
}

/**
 * Retries a set of previously-failed transactions.
 * Delegates to postTransactionBatch — same sequential, skip-on-failure semantics.
 */
export async function retryFailed(
  transactions: Transaction[],
): Promise<PostResult[]> {
  // Clear postError + postedToReckon === false so guards don't block retry
  const cleared = transactions.map(t => ({
    ...t,
    postedToReckon: false,
    postError:      undefined,
  }))
  return postTransactionBatch(cleared)
}
