/**
 * Server-side in-memory cache for the Reckon chart of accounts.
 * TTL: 60 minutes — accounts change rarely.
 *
 * Used by write.ts to resolve accountCode → Reckon accountId
 * without fetching on every individual post.
 */

import { getAccounts } from './api'
import type { ReckonAccount } from './types'

interface AccountCache {
  accounts: ReckonAccount[]
  fetchedAt: number   // unix ms
}

const TTL_MS = 60 * 60 * 1000   // 60 minutes

let _cache: AccountCache | null = null

export async function getAccountsWithCache(): Promise<ReckonAccount[]> {
  const now = Date.now()

  if (_cache && now - _cache.fetchedAt < TTL_MS) {
    return _cache.accounts
  }

  const accounts = await getAccounts()
  _cache = { accounts, fetchedAt: now }
  return accounts
}

export function _resetAccountCache() {
  _cache = null
}
