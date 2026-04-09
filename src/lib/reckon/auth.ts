/**
 * OAuth 2.0 Authorization Code flow for Reckon One API v2.
 *
 * Flow:
 *   1. Redirect treasurer to Reckon login: GET /api/reckon/auth
 *      → calls getAuthorizationUrl() → redirect to identity.reckon.com
 *   2. Reckon posts back: GET /api/reckon/callback?code=...&state=...
 *      → validateState(state) + exchangeCodeForTokens(code)
 *   3. Every subsequent API call: getAccessToken() auto-refreshes as needed
 *
 * Tokens are NEVER sent to the browser, stored in localStorage, or
 * committed to git. In-memory cache is backed by .reckon-tokens.json.
 */

import fs from 'node:fs'
import path from 'node:path'

const AUTH_URL   = 'https://identity.reckon.com/connect/authorize'
const TOKEN_URL  = 'https://identity.reckon.com/connect/token'
const TOKEN_FILE = path.join(process.cwd(), '.reckon-tokens.json')

// Read env vars lazily so tests can set them after import
function clientId(): string     { return process.env.RECKON_CLIENT_ID      ?? '' }
function clientSecret(): string { return process.env.RECKON_CLIENT_SECRET  ?? '' }
function redirectUri(): string  { return process.env.RECKON_REDIRECT_URI   ?? '' }

function basicAuth(): string {
  return Buffer.from(`${clientId()}:${clientSecret()}`).toString('base64')
}

// ─── Token store ──────────────────────────────────────────────────────────────

interface StoredTokens {
  accessToken:     string
  refreshToken:    string
  expiresAt:       number  // unix ms
  authenticatedAt: string  // ISO 8601
}

let _tokens: StoredTokens | null = null
let _pendingState: string | null = null

// ─── File persistence ─────────────────────────────────────────────────────────

function loadFromFile(): StoredTokens | null {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')) as StoredTokens
  } catch {
    return null
  }
}

function saveToFile(tokens: StoredTokens): void {
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf-8')
  } catch {
    // best-effort
  }
}

function deleteFile(): void {
  try {
    if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE)
  } catch {
    // best-effort
  }
}

function ensureLoaded(): void {
  if (_tokens === null) _tokens = loadFromFile()
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshTokens(): Promise<void> {
  if (!_tokens?.refreshToken) throw new Error('No refresh token')

  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: _tokens.refreshToken,
    redirect_uri:  redirectUri(),
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth()}`,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Reckon token refresh failed (${res.status}): ${text}`)
  }

  const json = await res.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  _tokens = {
    accessToken:     json.access_token,
    refreshToken:    json.refresh_token ?? _tokens.refreshToken,
    expiresAt:       Date.now() + json.expires_in * 1000,
    authenticatedAt: _tokens.authenticatedAt,
  }
  saveToFile(_tokens)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** True if we have a stored refresh token (treasurer has authenticated). */
export function isAuthenticated(): boolean {
  ensureLoaded()
  return _tokens !== null && !!_tokens.refreshToken
}

/** ISO 8601 timestamp of when the treasurer last authenticated, or null. */
export function getAuthenticatedAt(): string | null {
  ensureLoaded()
  return _tokens?.authenticatedAt ?? null
}

/**
 * Returns a valid access token, refreshing if within 5 minutes of expiry.
 * Throws if the treasurer has not yet authenticated.
 */
export async function getAccessToken(): Promise<string> {
  ensureLoaded()

  if (!_tokens || !_tokens.refreshToken) {
    throw new Error('Not authenticated. Visit /api/reckon/auth to connect Reckon One.')
  }

  if (_tokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    await refreshTokens()
  }

  return _tokens!.accessToken
}

/**
 * Builds the Reckon authorization URL and stores a CSRF state value.
 * The state must be validated in the callback via validateState().
 */
export function getAuthorizationUrl(): string {
  const state = crypto.randomUUID()
  const nonce = crypto.randomUUID()
  _pendingState = state

  const params = new URLSearchParams({
    client_id:     clientId(),
    response_type: 'code',
    scope:         'openid read write offline_access',
    redirect_uri:  redirectUri(),
    state,
    nonce,
  })

  return `${AUTH_URL}?${params.toString()}`
}

/**
 * Validates the state parameter from the OAuth callback (CSRF check).
 * One-time use — the stored state is cleared regardless of result.
 */
export function validateState(state: string): boolean {
  const ok = _pendingState !== null && _pendingState === state
  _pendingState = null
  return ok
}

/**
 * Exchanges an authorization code for access + refresh tokens.
 * Called from the callback route after Reckon redirects back.
 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type:   'authorization_code',
    code,
    redirect_uri: redirectUri(),
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth()}`,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Reckon token exchange failed (${res.status}): ${text}`)
  }

  const json = await res.json() as {
    access_token:  string
    refresh_token: string
    expires_in:    number
  }

  _tokens = {
    accessToken:     json.access_token,
    refreshToken:    json.refresh_token,
    expiresAt:       Date.now() + json.expires_in * 1000,
    authenticatedAt: new Date().toISOString(),
  }

  saveToFile(_tokens)
}

/** Clears all tokens (logout / force re-auth). */
export function clearTokens(): void {
  _tokens = null
  _pendingState = null
  deleteFile()
}

/** Resets in-memory state — used in tests only. */
export function _resetTokenCache(): void {
  _tokens = null
  _pendingState = null
}
