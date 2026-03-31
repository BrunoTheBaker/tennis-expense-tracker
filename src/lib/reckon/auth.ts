/**
 * OAuth 2.0 client credentials flow for Reckon One API v2.
 *
 * // TODO: RECKON API — set RECKON_CLIENT_ID, RECKON_CLIENT_SECRET, RECKON_BOOK_ID
 * in .env.local once credentials arrive.
 */

const RECKON_CLIENT_ID     = process.env.RECKON_CLIENT_ID     ?? 'YOUR_CLIENT_ID'
const RECKON_CLIENT_SECRET = process.env.RECKON_CLIENT_SECRET ?? 'YOUR_CLIENT_SECRET'
export const RECKON_BOOK_ID = process.env.RECKON_BOOK_ID      ?? 'YOUR_BOOK_ID'

export const RECKON_BASE_URL = 'https://api.reckonone.com/v2'
const RECKON_TOKEN_URL       = 'https://identity.reckon.com/connect/token'

// ─── Token cache ──────────────────────────────────────────────────────────────

interface TokenCache {
  accessToken: string
  expiresAt: number   // unix ms
}

let _tokenCache: TokenCache | null = null

export async function getAccessToken(): Promise<string> {
  const now = Date.now()

  if (_tokenCache && _tokenCache.expiresAt > now + 30_000) {
    return _tokenCache.accessToken
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     RECKON_CLIENT_ID,
    client_secret: RECKON_CLIENT_SECRET,
    scope:         'reckon.one.api',
  })

  const res = await fetch(RECKON_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Reckon auth failed (${res.status}): ${text}`)
  }

  const json = await res.json() as { access_token: string; expires_in: number }

  _tokenCache = {
    accessToken: json.access_token,
    expiresAt:   now + json.expires_in * 1000,
  }

  return _tokenCache.accessToken
}

// ─── Typed client ─────────────────────────────────────────────────────────────

export interface ReckonClient {
  get<T>(endpoint: string): Promise<T>
}

export async function createReckonClient(): Promise<ReckonClient> {
  const token = await getAccessToken()

  return {
    async get<T>(endpoint: string): Promise<T> {
      const url = `${RECKON_BASE_URL}${endpoint}`
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:        'application/json',
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Reckon API error (${res.status}) at ${endpoint}: ${text}`)
      }

      return res.json() as Promise<T>
    },
  }
}

/** Resets the cached token — useful in tests. */
export function _resetTokenCache() {
  _tokenCache = null
}
