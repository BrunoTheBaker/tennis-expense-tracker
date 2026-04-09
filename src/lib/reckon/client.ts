/**
 * Typed fetch wrapper for the Reckon One v2 API.
 *
 * The book ID is baked into the base URL — no caller needs to pass it.
 * Every request automatically attaches:
 *   Authorization: Bearer {access_token}
 *   Ocp-Apim-Subscription-Key: {RECKON_SUBSCRIPTION_KEY}
 *   Content-Type: application/json
 *
 * On a 401 response, the wrapper attempts a token refresh and retries once.
 */

import { getAccessToken } from './auth'

const BOOK_ID  = process.env.RECKON_BOOK_ID ?? '7f71d29b-8720-422d-8382-d961bb783990'
const BASE_URL = `https://api.reckon.com/r1/v2/${BOOK_ID}`

function subscriptionKey(): string {
  return process.env.RECKON_SUBSCRIPTION_KEY ?? ''
}

export class ReckonApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(`Reckon API error (${status}): ${message}`)
    this.name = 'ReckonApiError'
  }
}

async function buildHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken()
  return {
    'Authorization':             `Bearer ${token}`,
    'Ocp-Apim-Subscription-Key': subscriptionKey(),
    'Content-Type':              'application/json',
  }
}

async function parseError(res: Response): Promise<never> {
  const text = await res.text().catch(() => `HTTP ${res.status}`)
  throw new ReckonApiError(res.status, text)
}

/**
 * Makes an authenticated request to the Reckon API.
 * Endpoint should start with '/' e.g. '/ledgeraccounts'.
 * Handles 401 by refreshing the access token and retrying once.
 */
export async function reckonFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await buildHeaders()
  const url = BASE_URL + endpoint

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    // Token may have expired mid-request — refresh and retry once
    const retryHeaders = await buildHeaders()
    const retryRes = await fetch(url, { ...options, headers: retryHeaders })
    if (!retryRes.ok) await parseError(retryRes)
    return retryRes.json() as Promise<T>
  }

  if (!res.ok) await parseError(res)
  return res.json() as Promise<T>
}
