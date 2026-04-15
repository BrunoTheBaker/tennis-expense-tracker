/**
 * Server-side in-memory cache for the Reckon chart of accounts.
 * TTL: 60 minutes — accounts change rarely.
 *
 * Used by write.ts to resolve accountCode → Reckon accountId
 * without fetching on every individual post.
 */

import { getAccounts } from './api'
import type { Account } from './types'

// ─── Server-side in-memory cache ─────────────────────────────────────────────

interface AccountCache {
  accounts: Account[]
  fetchedAt: number   // unix ms
}

const TTL_MS = 60 * 60 * 1000   // 60 minutes

let _cache: AccountCache | null = null

/**
 * Returns the chart of accounts, re-fetching only if the cache is
 * missing or older than 60 minutes.
 */
export async function getAccountsWithCache(): Promise<Account[]> {
  const now = Date.now()

  if (_cache && now - _cache.fetchedAt < TTL_MS) {
    return _cache.accounts
  }

  const accounts = await getAccounts()
  _cache = { accounts, fetchedAt: now }
  return accounts
}

/** Clears the cache — useful in tests. */
export function _resetAccountCache() {
  _cache = null
}
