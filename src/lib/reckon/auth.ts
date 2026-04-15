/**
 * OAuth 2.0 client credentials flow for Reckon One API v2.
 *
 * Session model:
 *  - Tokens live in memory only — no file storage, no refresh tokens.
 *  - getAccessToken() throws ReckonAuthError if not connected, expired, or inactive.
 *  - Call connectWithCredentials() to start a session (e.g. from /api/reckon/auth).
 *  - Sessions expire after 5 minutes of inactivity OR when the access token expires.
 *
 * // TODO: RECKON API — set RECKON_CLIENT_ID, RECKON_CLIENT_SECRET, RECKON_BOOK_ID
 * in .env.local once credentials arrive.
 */

const RECKON_CLIENT_ID        = process.env.RECKON_CLIENT_ID        ?? 'YOUR_CLIENT_ID'
const RECKON_CLIENT_SECRET    = process.env.RECKON_CLIENT_SECRET    ?? 'YOUR_CLIENT_SECRET'
export const RECKON_BOOK_ID   = process.env.RECKON_BOOK_ID          ?? 'YOUR_BOOK_ID'
const RECKON_SUBSCRIPTION_KEY = process.env.RECKON_SUBSCRIPTION_KEY ?? ''

export const RECKON_BASE_URL = 'https://api.reckonone.com/v2'
const RECKON_TOKEN_URL       = 'https://identity.reckon.com/connect/token'

export const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000  // 5 minutes

import { ReckonAuthError } from './ReckonAuthError'

// ─── In-memory session store ──────────────────────────────────────────────────
// Cleared on server restart — no persistence, no refresh tokens.

interface TokenStore {
  accessToken:  string
  expiresAt:    number   // unix ms
  lastActivity: number   // unix ms
}

let tokenStore: TokenStore | null = null

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isInactive(): boolean {
  if (!tokenStore) return true
  return Date.now() - tokenStore.lastActivity > INACTIVITY_TIMEOUT_MS
}

export function clearTokens(): void {
  tokenStore = null
}

// ─── Connect ──────────────────────────────────────────────────────────────────

/** Exchange client credentials for an access token and start a new session. */
export async function connectWithCredentials(): Promise<void> {
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

  const now = Date.now()
  tokenStore = {
    accessToken:  json.access_token,
    expiresAt:    now + json.expires_in * 1000,
    lastActivity: now,
    // refresh_token intentionally discarded
  }
}

// ─── Get access token ─────────────────────────────────────────────────────────

/**
 * Returns the current access token, updating lastActivity.
 * Throws ReckonAuthError if the session is missing, expired, or inactive.
 */
export async function getAccessToken(): Promise<string> {
  if (!tokenStore) throw new ReckonAuthError('NOT_AUTHENTICATED')

  if (Date.now() > tokenStore.expiresAt) {
    clearTokens()
    throw new ReckonAuthError('TOKEN_EXPIRED')
  }

  if (isInactive()) {
    clearTokens()
    throw new ReckonAuthError('INACTIVITY_TIMEOUT')
  }

  // Update last activity on every valid use — active use naturally extends the session
  tokenStore.lastActivity = Date.now()
  return tokenStore.accessToken
}

// ─── Session status ───────────────────────────────────────────────────────────

export interface SessionStatus {
  authenticated:        boolean
  minutesRemaining:     number | null
  minutesSinceActivity: number | null
}

export function getSessionStatus(): SessionStatus {
  if (!tokenStore) {
    return { authenticated: false, minutesRemaining: null, minutesSinceActivity: null }
  }

  const now = Date.now()

  if (now > tokenStore.expiresAt || isInactive()) {
    clearTokens()
    return { authenticated: false, minutesRemaining: null, minutesSinceActivity: null }
  }

  const msUntilInactivity = INACTIVITY_TIMEOUT_MS - (now - tokenStore.lastActivity)
  const msUntilExpiry     = tokenStore.expiresAt - now
  const msRemaining       = Math.min(msUntilInactivity, msUntilExpiry)

  return {
    authenticated:        true,
    minutesRemaining:     Math.max(0, Math.floor(msRemaining / 60_000)),
    minutesSinceActivity: Math.floor((now - tokenStore.lastActivity) / 60_000),
  }
}

// ─── Typed HTTP client ────────────────────────────────────────────────────────

export interface ReckonClient {
  get<T>(endpoint: string): Promise<T>
  post<T>(endpoint: string, body: unknown): Promise<T>
}

export async function createReckonClient(): Promise<ReckonClient> {
  const token = await getAccessToken()

  function baseHeaders() {
    const h: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept:        'application/json',
    }
    if (RECKON_SUBSCRIPTION_KEY) {
      h['Ocp-Apim-Subscription-Key'] = RECKON_SUBSCRIPTION_KEY
    }
    return h
  }

  return {
    async get<T>(endpoint: string): Promise<T> {
      const url = `${RECKON_BASE_URL}${endpoint}`
      const res = await fetch(url, { headers: baseHeaders() })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Reckon API error (${res.status}) at GET ${endpoint}: ${text}`)
      }

      return res.json() as Promise<T>
    },

    async post<T>(endpoint: string, body: unknown): Promise<T> {
      const url = `${RECKON_BASE_URL}${endpoint}`
      const res = await fetch(url, {
        method:  'POST',
        headers: { ...baseHeaders(), 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Reckon API error (${res.status}) at POST ${endpoint}: ${text}`)
      }

      return res.json() as Promise<T>
    },
  }
}

/** Resets the token store — for use in tests only. */
export function _resetTokenStore(): void {
  tokenStore = null
}
