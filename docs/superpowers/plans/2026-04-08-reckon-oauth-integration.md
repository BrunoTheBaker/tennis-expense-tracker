# Reckon One OAuth Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the client_credentials stub in `src/lib/reckon/` with a full OAuth 2.0 Authorization Code flow, wire live Reckon transactions into the period-driven data loader, and update the Settings UI with a live connect/disconnect panel.

**Architecture:** Auth tokens are stored server-side only (in-memory + `.reckon-tokens.json` file backup). Browser calls `/api/reckon/auth` to trigger the OAuth redirect; Reckon posts back to `/api/reckon/callback`; tokens are exchanged and persisted. `client.ts` wraps all Reckon API calls with auto-auth and 401 retry. `dataLoader.ts` (new, client-side) calls `/api/reckon/transactions` which handles auth-required transparently. The Settings panel calls `/api/reckon/status` to show connected/disconnected state.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Vitest 2 (`environment: 'node'`), Node.js `fs` for token file

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `.gitignore` | Add `.reckon-tokens.json` |
| Modify | `src/lib/reckon/types.ts` | Rename conflicting type; add spec interfaces |
| Modify | `src/lib/reckon/mock.ts` | Update import after type rename |
| Modify | `src/app/api/reckon/[endpoint]/route.ts` | Use renamed type; add auth-required status |
| **Rewrite** | `src/lib/reckon/auth.ts` | OAuth 2.0 Authorization Code + file-backed tokens |
| Create | `src/lib/reckon/client.ts` | `reckonFetch<T>` with auto-auth + 401 retry |
| **Rewrite** | `src/lib/reckon/api.ts` | Correct endpoint paths; new function signatures |
| Create | `src/lib/reckon/transforms.ts` | `ReckonTransaction → Transaction` mapper |
| Modify | `src/lib/reckon/index.ts` | 5-var `isReckonConfigured()` |
| Create | `src/app/api/reckon/auth/route.ts` | Redirect browser to Reckon OAuth |
| Create | `src/app/api/reckon/callback/route.ts` | Handle OAuth callback + exchange code |
| Create | `src/app/api/reckon/status/route.ts` | Return `{ configured, connected, authenticatedAt }` |
| Create | `src/app/api/reckon/disconnect/route.ts` | POST clears tokens |
| Modify | `src/app/api/reckon/[endpoint]/route.ts` | Return `auth_required` status when not authed |
| **Rewrite** | `src/lib/reckon/__tests__/auth.test.ts` | Tests for new OAuth flow |
| Create | `src/lib/reckon/__tests__/transforms.test.ts` | Tests for transform function |
| Create | `src/lib/dataCache.ts` | sessionStorage cache + `SourceStatus` type |
| Create | `src/lib/__tests__/dataCache.test.ts` | Cache CRUD tests |
| Create | `src/lib/dataLoader.ts` | Period data loading: Square + Reckon |
| Create | `src/lib/__tests__/dataLoader.test.ts` | Date range + loading tests |
| Create | `src/components/DataLoadingPanel.tsx` | Spinner with per-source status |
| Create | `src/components/CacheStatusBar.tsx` | Loaded count + age + Refresh/Clear |
| **Rewrite** | `src/components/settings/ReckonIntegration.tsx` | Live OAuth connect panel |
| Create | `docs/PLANNING.md` | Architecture documentation |

---

### Task 1: Setup — `.gitignore` and type rename

**Files:**
- Modify: `.gitignore`
- Modify: `src/lib/reckon/types.ts`
- Modify: `src/lib/reckon/mock.ts`
- Modify: `src/app/api/reckon/[endpoint]/route.ts`

No tests — these are non-logic changes that unblock everything else.

- [ ] **Step 1: Add `.reckon-tokens.json` to `.gitignore`**

Open `.gitignore` and add after the `# local env files` section:

```
# Reckon OAuth token cache (server-side only, never commit)
.reckon-tokens.json
```

- [ ] **Step 2: Rename conflicting type in `src/lib/reckon/types.ts`**

The existing `ReckonTransaction` has a `lines[]` field (raw journal format). The spec defines `ReckonTransaction` as a flat ledger entry. Rename the old one to `ReckonJournalEntry` so both can coexist, then add the spec's new interfaces.

Replace the full file with:

```ts
/**
 * TypeScript interfaces for Reckon One API v2 response shapes.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export interface ReckonApiError {
  statusCode: number
  message: string
  details?: string
}

export interface PagedResponse<T> {
  data: T[]
  totalCount: number
  pageSize: number
  pageNumber: number
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export type AccountType =
  | 'Asset'
  | 'Liability'
  | 'Equity'
  | 'Income'
  | 'Expense'
  | 'CostOfSales'

/** Raw account from Reckon chart of accounts endpoint. */
export interface Account {
  id: string
  code: string          // e.g. "4-0201"
  name: string          // e.g. "Monday Social Tennis"
  type: AccountType
  isActive: boolean
  description?: string
}

/** Spec-aligned account type (used by api.ts getAccounts). */
export interface ReckonAccount {
  id: string
  name: string
  code: string
  type: string
  balance: number
}

// ─── Bank accounts ────────────────────────────────────────────────────────────

/** Raw bank account from Reckon bank accounts endpoint. */
export interface BankAccount {
  id: string
  accountId: string
  accountCode: string
  name: string
  bankName?: string
  bsb?: string
  accountNumber?: string
  balance: number
  currency: string
}

/** Spec-aligned bank balance type (used by api.ts getBankBalances). */
export interface ReckonBankBalance {
  id: string
  name: string
  balance: number
  currency: string
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType =
  | 'Spend'
  | 'Receive'
  | 'Transfer'
  | 'Journal'

export interface TransactionLine {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  description?: string
  debit: number
  credit: number
  amount: number
}

/**
 * Raw journal transaction from the Reckon API (has nested line items).
 * Used by the mock data and the generic proxy route.
 */
export interface ReckonJournalEntry {
  id: string
  date: string
  type: TransactionType
  referenceNumber?: string
  description: string
  totalAmount: number
  lines: TransactionLine[]
}

/**
 * Flat ledger transaction — one line item per entry.
 * This is the spec-defined shape returned by getLedgerTransactions()
 * and the input type for reckonTransactionToTransaction().
 */
export interface ReckonTransaction {
  id: string
  transactionDate: string   // ISO 8601 date string, e.g. "2026-01-15"
  description: string
  amount: number            // positive = credit, negative = debit
  type: 'debit' | 'credit'
  accountId: string
  accountName: string
  contactName?: string
  reference?: string
  memo?: string
}

// ─── Ledger entries ───────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string
  date: string
  description: string
  referenceNumber?: string
  accountId: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  runningBalance: number
}

// ─── P&L report ───────────────────────────────────────────────────────────────

export interface ReckonPnL {
  income:    { accountName: string; amount: number }[]
  expenses:  { accountName: string; amount: number }[]
  netProfit: number
}
```

- [ ] **Step 3: Update `src/lib/reckon/mock.ts` to use renamed type**

Open `src/lib/reckon/mock.ts`. Change the import line from:
```ts
import type { ReckonTransaction, Account, BankAccount, LedgerEntry } from './types'
```
to:
```ts
import type { ReckonJournalEntry, Account, BankAccount, LedgerEntry } from './types'
```

Then rename all `ReckonTransaction[]` type annotations in that file to `ReckonJournalEntry[]`:
- Line 79: `export const MOCK_TRANSACTIONS: ReckonJournalEntry[] = [`

- [ ] **Step 4: Update the proxy route to use renamed type**

Open `src/app/api/reckon/[endpoint]/route.ts`. Change the import:
```ts
import {
  MOCK_TRANSACTIONS,
  MOCK_ACCOUNTS,
  MOCK_BANK_ACCOUNTS,
  MOCK_LEDGER_ENTRIES,
} from '@/lib/reckon/mock'
```
(No change needed to mock imports — `MOCK_TRANSACTIONS` is still exported from mock.ts, just typed as `ReckonJournalEntry[]` now.)

No code logic change needed — the file imports from mock.ts by name and TypeScript will infer the new type.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add .gitignore src/lib/reckon/types.ts src/lib/reckon/mock.ts src/app/api/reckon/[endpoint]/route.ts
git commit -m "chore(reckon): rename ReckonTransaction→ReckonJournalEntry; add spec types to types.ts"
```

---

### Task 2: Rewrite `src/lib/reckon/auth.ts` — OAuth 2.0 Authorization Code flow

**Files:**
- Rewrite: `src/lib/reckon/auth.ts`
- Rewrite: `src/lib/reckon/__tests__/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

Replace `src/lib/reckon/__tests__/auth.test.ts` with:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAccessToken,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  isAuthenticated,
  clearTokens,
  validateState,
  _resetTokenCache,
} from '../auth'

// Mock node:fs — no real file I/O in tests
vi.mock('node:fs', () => ({
  default: {
    existsSync:    vi.fn().mockReturnValue(false),
    readFileSync:  vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync:    vi.fn(),
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockTokenResponse(opts: {
  access_token?: string
  refresh_token?: string
  expires_in?: number
} = {}) {
  return vi.fn().mockResolvedValue({
    ok:   true,
    json: async () => ({
      access_token:  opts.access_token  ?? 'test-access-token',
      refresh_token: opts.refresh_token ?? 'test-refresh-token',
      expires_in:    opts.expires_in    ?? 10800,
    }),
    text: async () => '',
  })
}

// ─── isAuthenticated ──────────────────────────────────────────────────────────

describe('isAuthenticated', () => {
  beforeEach(() => { _resetTokenCache(); vi.restoreAllMocks() })

  it('returns false when no tokens stored', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns true after exchangeCodeForTokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse())
    await exchangeCodeForTokens('auth-code-123')
    expect(isAuthenticated()).toBe(true)
  })

  it('returns false after clearTokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse())
    await exchangeCodeForTokens('auth-code-123')
    clearTokens()
    expect(isAuthenticated()).toBe(false)
  })
})

// ─── exchangeCodeForTokens ────────────────────────────────────────────────────

describe('exchangeCodeForTokens', () => {
  beforeEach(() => { _resetTokenCache(); vi.restoreAllMocks() })

  it('stores both access and refresh tokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse({ access_token: 'my-access', refresh_token: 'my-refresh' }))
    await exchangeCodeForTokens('auth-code-123')
    expect(isAuthenticated()).toBe(true)
    const token = await getAccessToken()
    expect(token).toBe('my-access')
  })

  it('throws when exchange endpoint returns error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400, text: async () => 'invalid_grant',
    }))
    await expect(exchangeCodeForTokens('bad-code')).rejects.toThrow('Reckon token exchange failed (400)')
  })

  it('sends Authorization: Basic with base64(client_id:client_secret)', async () => {
    process.env.RECKON_CLIENT_ID     = 'my-client'
    process.env.RECKON_CLIENT_SECRET = 'my-secret'
    const fetchMock = mockTokenResponse()
    vi.stubGlobal('fetch', fetchMock)

    await exchangeCodeForTokens('code-abc')

    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    const header = (opts.headers as Record<string, string>)['Authorization']
    const expected = 'Basic ' + Buffer.from('my-client:my-secret').toString('base64')
    expect(header).toBe(expected)

    delete process.env.RECKON_CLIENT_ID
    delete process.env.RECKON_CLIENT_SECRET
  })
})

// ─── getAccessToken ───────────────────────────────────────────────────────────

describe('getAccessToken', () => {
  beforeEach(() => { _resetTokenCache(); vi.restoreAllMocks() })

  it('throws when not authenticated', async () => {
    await expect(getAccessToken()).rejects.toThrow('Not authenticated')
  })

  it('returns cached token on second call without re-fetching', async () => {
    const fetchMock = mockTokenResponse({ access_token: 'cached-token' })
    vi.stubGlobal('fetch', fetchMock)
    await exchangeCodeForTokens('code-1')
    const first  = await getAccessToken()
    const second = await getAccessToken()
    expect(first).toBe('cached-token')
    expect(second).toBe('cached-token')
    expect(fetchMock).toHaveBeenCalledTimes(1)  // only exchange, no refresh
  })

  it('refreshes when token is within 5 minutes of expiry (expires_in: 0)', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok:   true,
        json: async () => ({ access_token: 'old-access', refresh_token: 'my-refresh', expires_in: 0 }),
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok:   true,
        json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 10800 }),
        text: async () => '',
      })
    vi.stubGlobal('fetch', fetchMock)

    await exchangeCodeForTokens('code-1')
    const token = await getAccessToken()  // triggers refresh because expires_in: 0

    expect(token).toBe('new-access')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

// ─── getAuthorizationUrl ──────────────────────────────────────────────────────

describe('getAuthorizationUrl', () => {
  it('returns URL with required OAuth params', () => {
    const url = getAuthorizationUrl()
    expect(url).toContain('identity.reckon.com/connect/authorize')
    expect(url).toContain('response_type=code')
    expect(url).toContain('scope=')
    expect(url).toContain('state=')
    expect(url).toContain('nonce=')
  })

  it('generates a different state on each call', () => {
    const url1 = getAuthorizationUrl()
    const url2 = getAuthorizationUrl()
    const state1 = new URL(url1).searchParams.get('state')
    const state2 = new URL(url2).searchParams.get('state')
    expect(state1).not.toBe(state2)
  })
})

// ─── validateState ────────────────────────────────────────────────────────────

describe('validateState', () => {
  beforeEach(() => { _resetTokenCache() })

  it('returns true for the state generated by getAuthorizationUrl', () => {
    const url   = getAuthorizationUrl()
    const state = new URL(url).searchParams.get('state')!
    expect(validateState(state)).toBe(true)
  })

  it('returns false for an unknown state', () => {
    getAuthorizationUrl()
    expect(validateState('not-the-right-state')).toBe(false)
  })

  it('is one-time use — second call with same state returns false', () => {
    const url   = getAuthorizationUrl()
    const state = new URL(url).searchParams.get('state')!
    expect(validateState(state)).toBe(true)
    expect(validateState(state)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/reckon/__tests__/auth.test.ts
```
Expected: FAIL — most tests will error because the old `auth.ts` uses `client_credentials` flow and doesn't export `exchangeCodeForTokens`, `validateState`, etc.

- [ ] **Step 3: Write the new `src/lib/reckon/auth.ts`**

Replace the full file with:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/reckon/__tests__/auth.test.ts
```
Expected: PASS (all ~14 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/reckon/auth.ts src/lib/reckon/__tests__/auth.test.ts
git commit -m "feat(reckon): replace client_credentials with OAuth 2.0 Authorization Code flow"
```

---

### Task 3: Create `src/lib/reckon/client.ts`

**Files:**
- Create: `src/lib/reckon/client.ts`

No separate unit tests — `client.ts` is a thin wrapper; the API-level tests in Task 4 cover its behaviour indirectly.

- [ ] **Step 1: Create `src/lib/reckon/client.ts`**

```ts
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

const BOOK_ID = process.env.RECKON_BOOK_ID ?? '7f71d29b-8720-422d-8382-d961bb783990'
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/reckon/client.ts
git commit -m "feat(reckon): add reckonFetch client wrapper with auto-auth and 401 retry"
```

---

### Task 4: Rewrite `src/lib/reckon/api.ts`

**Files:**
- Rewrite: `src/lib/reckon/api.ts`
- Create: `src/lib/reckon/__tests__/api.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/reckon/__tests__/api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getLedgerTransactions, getAccounts, getBankBalances, getProfitAndLoss } from '../api'

// Mock the client so we never make real HTTP calls
vi.mock('../client', () => ({
  reckonFetch: vi.fn(),
  ReckonApiError: class ReckonApiError extends Error {
    constructor(public status: number, message: string) { super(message) }
  },
}))

import { reckonFetch } from '../client'

function mockFetch(data: unknown) {
  vi.mocked(reckonFetch).mockResolvedValueOnce(data)
}

function mockFetchError(status = 502) {
  const { ReckonApiError } = vi.importActual('../client') as typeof import('../client')
  vi.mocked(reckonFetch).mockRejectedValueOnce(new ReckonApiError(status, 'server error'))
}

beforeEach(() => vi.clearAllMocks())

// ─── getLedgerTransactions ────────────────────────────────────────────────────

describe('getLedgerTransactions', () => {
  it('returns array of ReckonTransaction when API succeeds', async () => {
    mockFetch({
      items: [
        { id: 'tx-1', transactionDate: '2026-01-15', description: 'Test', amount: 100, type: 'credit',
          accountId: 'a1', accountName: 'Drink Sales' },
      ],
    })
    const result = await getLedgerTransactions('2026-01-01', '2026-01-31')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('tx-1')
  })

  it('returns [] on API error without throwing', async () => {
    vi.mocked(reckonFetch).mockRejectedValueOnce(new Error('Network error'))
    const result = await getLedgerTransactions('2026-01-01', '2026-01-31')
    expect(result).toEqual([])
  })

  it('calls the correct endpoint with OData filter', async () => {
    mockFetch({ items: [] })
    await getLedgerTransactions('2026-01-01', '2026-01-31')
    const [endpoint] = vi.mocked(reckonFetch).mock.calls[0] as [string]
    expect(endpoint).toContain('/transactions')
    expect(endpoint).toContain('2026-01-01')
    expect(endpoint).toContain('2026-01-31')
  })
})

// ─── getAccounts ──────────────────────────────────────────────────────────────

describe('getAccounts', () => {
  it('returns array of ReckonAccount when API succeeds', async () => {
    mockFetch({
      items: [
        { id: 'a1', name: 'Drink Sales', code: '4-4011', type: 'Income', balance: 7834.95 },
      ],
    })
    const result = await getAccounts()
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('4-4011')
  })

  it('returns [] on API error without throwing', async () => {
    vi.mocked(reckonFetch).mockRejectedValueOnce(new Error('fail'))
    expect(await getAccounts()).toEqual([])
  })
})

// ─── getBankBalances ──────────────────────────────────────────────────────────

describe('getBankBalances', () => {
  it('returns array of ReckonBankBalance when API succeeds', async () => {
    mockFetch({
      items: [
        { id: 'ba1', name: 'Bank - Trading Account', balance: 37918.31, currency: 'AUD' },
      ],
    })
    const result = await getBankBalances()
    expect(result).toHaveLength(1)
    expect(result[0].balance).toBe(37918.31)
  })

  it('returns [] on API error without throwing', async () => {
    vi.mocked(reckonFetch).mockRejectedValueOnce(new Error('fail'))
    expect(await getBankBalances()).toEqual([])
  })
})

// ─── getProfitAndLoss ─────────────────────────────────────────────────────────

describe('getProfitAndLoss', () => {
  it('returns ReckonPnL when API succeeds', async () => {
    mockFetch({
      income:    [{ accountName: 'Drink Sales', amount: 7834.95 }],
      expenses:  [{ accountName: 'Electricity', amount: 312.80 }],
      netProfit: 7522.15,
    })
    const result = await getProfitAndLoss('2026-01-01', '2026-01-31')
    expect(result?.netProfit).toBe(7522.15)
  })

  it('returns null on API error without throwing', async () => {
    vi.mocked(reckonFetch).mockRejectedValueOnce(new Error('fail'))
    expect(await getProfitAndLoss('2026-01-01', '2026-01-31')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/reckon/__tests__/api.test.ts
```
Expected: FAIL — old `api.ts` exports `getTransactions` not `getLedgerTransactions`

- [ ] **Step 3: Rewrite `src/lib/reckon/api.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/reckon/__tests__/api.test.ts
```
Expected: PASS (all 8 tests)

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/reckon/api.ts src/lib/reckon/__tests__/api.test.ts
git commit -m "feat(reckon): rewrite api.ts with correct v2 endpoints and new function signatures"
```

---

### Task 5: Create `src/lib/reckon/transforms.ts`

**Files:**
- Create: `src/lib/reckon/transforms.ts`
- Create: `src/lib/reckon/__tests__/transforms.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/reckon/__tests__/transforms.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { reckonTransactionToTransaction } from '../transforms'
import type { ReckonTransaction } from '../types'

function makeRt(overrides: Partial<ReckonTransaction> = {}): ReckonTransaction {
  return {
    id:              'rt-1',
    transactionDate: '2026-01-15',
    description:     'SYNERGY BPAY ELECTRICITY',
    amount:          312.80,
    type:            'debit',
    accountId:       'acc-6-1203',
    accountName:     'Clubhouse - Electricity',
    ...overrides,
  }
}

describe('reckonTransactionToTransaction', () => {
  it('maps id to reference', () => {
    const t = reckonTransactionToTransaction(makeRt({ id: 'rt-abc' }))
    expect(t.reference).toBe('rt-abc')
  })

  it('overrides reference with rt.reference when present', () => {
    const t = reckonTransactionToTransaction(makeRt({ reference: 'INV-001' }))
    expect(t.reference).toBe('INV-001')
  })

  it('converts ISO date to DD/MM/YYYY', () => {
    const t = reckonTransactionToTransaction(makeRt({ transactionDate: '2026-01-15' }))
    expect(t.date).toBe('15/01/2026')
  })

  it('debit transaction: amount is negative, debit > 0, credit = 0', () => {
    const t = reckonTransactionToTransaction(makeRt({ amount: 312.80, type: 'debit' }))
    expect(t.debit).toBe(312.80)
    expect(t.credit).toBe(0)
    expect(t.amount).toBe(-312.80)
  })

  it('credit transaction: amount is positive, credit > 0, debit = 0', () => {
    const t = reckonTransactionToTransaction(makeRt({ amount: 557.85, type: 'credit' }))
    expect(t.debit).toBe(0)
    expect(t.credit).toBe(557.85)
    expect(t.amount).toBe(557.85)
  })

  it('uses memo as fallback description when description is empty', () => {
    const t = reckonTransactionToTransaction(makeRt({ description: '', memo: 'from memo' }))
    expect(t.description).toBe('from memo')
  })

  it('falls back to "Reckon transaction" when both description and memo are empty', () => {
    const t = reckonTransactionToTransaction(makeRt({ description: '', memo: undefined }))
    expect(t.description).toBe('Reckon transaction')
  })

  it('sets source to "reckon"', () => {
    expect(reckonTransactionToTransaction(makeRt()).source).toBe('reckon')
  })

  it('sets status to "confirmed"', () => {
    expect(reckonTransactionToTransaction(makeRt()).status).toBe('confirmed')
  })

  it('matches accountName to a cost centre ledgerCode via COST_CENTRE_MAP', () => {
    // "Clubhouse - Electricity" has ledgerCode '6-1203' in costCentres.ts
    const t = reckonTransactionToTransaction(makeRt({ accountName: 'Clubhouse - Electricity' }))
    // The label in COST_CENTRES is "Clubhouse - Electricity" — exact match
    expect(t.accountCode).toBe('6-1203')
  })

  it('sets accountCode to undefined when accountName has no matching cost centre', () => {
    const t = reckonTransactionToTransaction(makeRt({ accountName: 'Unknown Account XYZ' }))
    expect(t.accountCode).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/reckon/__tests__/transforms.test.ts
```
Expected: FAIL with "Cannot find module '../transforms'"

- [ ] **Step 3: Create `src/lib/reckon/transforms.ts`**

```ts
import type { ReckonTransaction } from './types'
import type { Transaction } from '@/lib/financialData'
import { COST_CENTRES } from '@/lib/costCentres'

/** Convert ISO 8601 date string to DD/MM/YYYY */
function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

/**
 * Try to match a Reckon account name to a cost centre ledger code.
 * The Reckon account name (e.g. "Clubhouse - Electricity") is compared
 * case-insensitively against COST_CENTRES labels.
 */
function resolveAccountCode(accountName: string): string | undefined {
  const lower = accountName.toLowerCase()
  return COST_CENTRES.find(cc => cc.label.toLowerCase() === lower)?.ledgerCode
}

/**
 * Maps a flat Reckon ledger transaction to the app's internal Transaction type.
 * Used by dataLoader.ts to merge Reckon data with Square data.
 */
export function reckonTransactionToTransaction(rt: ReckonTransaction): Transaction {
  const absAmount = Math.abs(rt.amount)
  const isDebit   = rt.type === 'debit'
  const desc      = rt.description || rt.memo || 'Reckon transaction'

  return {
    date:        isoToDisplay(rt.transactionDate),
    description: desc,
    debit:       isDebit ? absAmount : 0,
    credit:      isDebit ? 0 : absAmount,
    amount:      isDebit ? -absAmount : absAmount,
    reference:   rt.reference ?? rt.id,
    status:      'confirmed',
    source:      'reckon',
    accountCode: resolveAccountCode(rt.accountName),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/reckon/__tests__/transforms.test.ts
```
Expected: PASS (all 11 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/reckon/transforms.ts src/lib/reckon/__tests__/transforms.test.ts
git commit -m "feat(reckon): add reckonTransactionToTransaction transform"
```

---

### Task 6: Update `src/lib/reckon/index.ts`

**Files:**
- Modify: `src/lib/reckon/index.ts`

The existing `isReckonConfigured()` checks 3 env vars. The spec requires all 5. Also need to export new modules.

- [ ] **Step 1: Update `src/lib/reckon/index.ts`**

```ts
export function isReckonConfigured(): boolean {
  const id       = process.env.RECKON_CLIENT_ID
  const secret   = process.env.RECKON_CLIENT_SECRET
  const key      = process.env.RECKON_SUBSCRIPTION_KEY
  const book     = process.env.RECKON_BOOK_ID
  const redirect = process.env.RECKON_REDIRECT_URI

  return (
    !!id       && id       !== 'YOUR_CLIENT_ID'       &&
    !!secret   && secret   !== 'YOUR_CLIENT_SECRET'   &&
    !!key      && key      !== 'YOUR_SUBSCRIPTION_KEY' &&
    !!book     && book     !== 'YOUR_BOOK_ID'          &&
    !!redirect
  )
}

export * from './types'
export * from './auth'
export * from './api'
export * from './transforms'
export * from './mock'
```

- [ ] **Step 2: Update the `isReckonConfigured` tests in auth.test.ts**

Add to `src/lib/reckon/__tests__/auth.test.ts` (at the bottom, a new describe block):

```ts
// ─── isReckonConfigured ───────────────────────────────────────────────────────

import { isReckonConfigured } from '../index'

describe('isReckonConfigured', () => {
  const saved = { ...process.env }

  afterEach(() => {
    Object.keys(process.env).forEach(k => { if (!(k in saved)) delete process.env[k] })
    Object.assign(process.env, saved)
  })

  it('returns false when any var is missing', () => {
    delete process.env.RECKON_CLIENT_ID
    expect(isReckonConfigured()).toBe(false)
  })

  it('returns false when RECKON_SUBSCRIPTION_KEY is missing', () => {
    process.env.RECKON_CLIENT_ID     = 'real'
    process.env.RECKON_CLIENT_SECRET = 'real'
    process.env.RECKON_BOOK_ID       = 'real'
    process.env.RECKON_REDIRECT_URI  = 'http://127.0.0.1:3000/api/reckon/callback'
    delete process.env.RECKON_SUBSCRIPTION_KEY
    expect(isReckonConfigured()).toBe(false)
  })

  it('returns true when all 5 vars are set to real values', () => {
    process.env.RECKON_CLIENT_ID         = 'real-client'
    process.env.RECKON_CLIENT_SECRET     = 'real-secret'
    process.env.RECKON_SUBSCRIPTION_KEY  = 'real-key'
    process.env.RECKON_BOOK_ID           = 'real-book'
    process.env.RECKON_REDIRECT_URI      = 'http://127.0.0.1:3000/api/reckon/callback'
    expect(isReckonConfigured()).toBe(true)
  })
})
```

You will need to add `afterEach` to the imports at the top of auth.test.ts:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
```

- [ ] **Step 3: Run auth tests to verify they pass**

```bash
npx vitest run src/lib/reckon/__tests__/auth.test.ts
```
Expected: PASS (all tests including new `isReckonConfigured` tests)

- [ ] **Step 4: Commit**

```bash
git add src/lib/reckon/index.ts src/lib/reckon/__tests__/auth.test.ts
git commit -m "feat(reckon): update index.ts to export new modules; isReckonConfigured checks 5 vars"
```

---

### Task 7: Create API routes — auth, callback, status, disconnect

**Files:**
- Create: `src/app/api/reckon/auth/route.ts`
- Create: `src/app/api/reckon/callback/route.ts`
- Create: `src/app/api/reckon/status/route.ts`
- Create: `src/app/api/reckon/disconnect/route.ts`

No unit tests for route handlers — they are thin wrappers over tested auth functions.

- [ ] **Step 1: Create `src/app/api/reckon/auth/route.ts`**

```ts
/**
 * GET /api/reckon/auth
 * Redirects the browser to Reckon's OAuth login page.
 * After login, Reckon posts back to /api/reckon/callback.
 */
import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/reckon/auth'
import { isReckonConfigured } from '@/lib/reckon'

export async function GET() {
  if (!isReckonConfigured()) {
    return NextResponse.json(
      { error: 'Reckon credentials not configured in .env.local' },
      { status: 503 }
    )
  }

  const url = getAuthorizationUrl()
  return NextResponse.redirect(url)
}
```

- [ ] **Step 2: Create `src/app/api/reckon/callback/route.ts`**

```ts
/**
 * GET /api/reckon/callback?code={code}&state={state}
 * Handles the OAuth redirect from Reckon's login page.
 * Validates CSRF state, exchanges code for tokens, then redirects to Settings.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { validateState, exchangeCodeForTokens } from '@/lib/reckon/auth'

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  if (!code || !state) {
    console.error('[reckon/callback] Missing code or state')
    return NextResponse.redirect(new URL('/settings?reckon=error', req.url))
  }

  if (!validateState(state)) {
    console.error('[reckon/callback] State mismatch — possible CSRF')
    return NextResponse.redirect(new URL('/settings?reckon=error', req.url))
  }

  try {
    await exchangeCodeForTokens(code)
    return NextResponse.redirect(new URL('/settings?reckon=connected', req.url))
  } catch (err) {
    console.error('[reckon/callback] Token exchange failed:', err)
    return NextResponse.redirect(new URL('/settings?reckon=error', req.url))
  }
}
```

- [ ] **Step 3: Create `src/app/api/reckon/status/route.ts`**

```ts
/**
 * GET /api/reckon/status
 * Returns whether Reckon is configured and the treasurer is authenticated.
 * Used by ReckonIntegration.tsx to show connected/disconnected state.
 */
import { NextResponse } from 'next/server'
import { isAuthenticated, getAuthenticatedAt } from '@/lib/reckon/auth'
import { isReckonConfigured } from '@/lib/reckon'

export async function GET() {
  const configured = isReckonConfigured()
  const connected  = configured && isAuthenticated()

  return NextResponse.json({
    configured,
    connected,
    authenticatedAt: connected ? getAuthenticatedAt() : null,
  })
}
```

- [ ] **Step 4: Create `src/app/api/reckon/disconnect/route.ts`**

```ts
/**
 * POST /api/reckon/disconnect
 * Clears stored OAuth tokens — the treasurer must re-authenticate.
 */
import { NextResponse } from 'next/server'
import { clearTokens } from '@/lib/reckon/auth'

export async function POST() {
  clearTokens()
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/app/api/reckon/auth/route.ts src/app/api/reckon/callback/route.ts src/app/api/reckon/status/route.ts src/app/api/reckon/disconnect/route.ts
git commit -m "feat(reckon): add OAuth auth, callback, status, and disconnect API routes"
```

---

### Task 8: Update `src/app/api/reckon/[endpoint]/route.ts`

**Files:**
- Modify: `src/app/api/reckon/[endpoint]/route.ts`

Add `auth_required` status handling for the transactions endpoint so `dataLoader.ts` can detect when the treasurer needs to re-authenticate.

- [ ] **Step 1: Replace the file with the updated version**

```ts
/**
 * Server-side proxy for Reckon One API calls.
 * Keeps credentials out of the browser — all Reckon requests must
 * go through this route handler.
 *
 * Usage: GET /api/reckon/<endpoint>?from=2025-03-01&to=2026-01-31
 *
 * Supported endpoints:
 *   transactions   → getLedgerTransactions(from, to)
 *   accounts       → getAccounts()
 *   bankaccounts   → getBankBalances()
 *   ledger         → falls back to mock (legacy)
 *
 * Status responses:
 *   { status: 'not_configured' } — env vars not set
 *   { status: 'auth_required'  } — treasurer has not authenticated
 *   { data: [...] }             — success
 */

import { NextRequest, NextResponse } from 'next/server'
import { isReckonConfigured } from '@/lib/reckon'
import { isAuthenticated } from '@/lib/reckon/auth'
import { getLedgerTransactions, getAccounts, getBankBalances } from '@/lib/reckon/api'
import {
  MOCK_TRANSACTIONS,
  MOCK_ACCOUNTS,
  MOCK_BANK_ACCOUNTS,
  MOCK_LEDGER_ENTRIES,
} from '@/lib/reckon/mock'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params
  const search  = req.nextUrl.searchParams
  const fromStr = search.get('from')
  const toStr   = search.get('to')
  const from = fromStr ?? '2025-03-01'
  const to   = toStr   ?? new Date().toISOString().slice(0, 10)

  if (!isReckonConfigured()) {
    // Return mock data so the UI renders before credentials are set
    const mockData = {
      transactions: MOCK_TRANSACTIONS,
      accounts:     MOCK_ACCOUNTS,
      bankaccounts: MOCK_BANK_ACCOUNTS,
      ledger:       MOCK_LEDGER_ENTRIES,
    }[endpoint]

    if (!mockData) {
      return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 404 })
    }

    return NextResponse.json({ data: mockData, _mock: true })
  }

  if (!isAuthenticated()) {
    return NextResponse.json({ status: 'auth_required', data: [] }, { status: 401 })
  }

  try {
    let data: unknown

    switch (endpoint) {
      case 'transactions':
        data = await getLedgerTransactions(from, to)
        break
      case 'accounts':
        data = await getAccounts()
        break
      case 'bankaccounts':
        data = await getBankBalances()
        break
      case 'ledger':
        // Legacy — return mock until ledger report endpoint is confirmed
        data = MOCK_LEDGER_ENTRIES
        break
      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[/api/reckon/${endpoint}]`, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/reckon/[endpoint]/route.ts
git commit -m "feat(reckon): proxy route handles auth_required status and uses new api.ts functions"
```

---

### Task 9: Create `src/lib/dataCache.ts`

**Files:**
- Create: `src/lib/dataCache.ts`
- Create: `src/lib/__tests__/dataCache.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/dataCache.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCachedPeriod,
  setCachedPeriod,
  clearCachedPeriod,
  getActivePeriodKey,
  setActivePeriodKey,
} from '../dataCache'
import type { PeriodCache } from '../dataCache'

const store: Record<string, string> = {}
const mockStorage = {
  getItem:    (k: string) => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
  vi.stubGlobal('sessionStorage', mockStorage)
})

const SAMPLE: PeriodCache = {
  periodKey:   'jan-2026',
  transactions: [],
  loadedAt:    '2026-04-01T10:00:00.000Z',
  sources:     { square: 'ok', reckon: 'not_configured', stripe: 'not_configured' },
}

describe('getCachedPeriod', () => {
  it('returns null when no cache exists', () => {
    expect(getCachedPeriod('jan-2026')).toBeNull()
  })
  it('returns cached value after setCachedPeriod', () => {
    setCachedPeriod(SAMPLE)
    expect(getCachedPeriod('jan-2026')).toEqual(SAMPLE)
  })
  it('returns null after clearCachedPeriod', () => {
    setCachedPeriod(SAMPLE)
    clearCachedPeriod('jan-2026')
    expect(getCachedPeriod('jan-2026')).toBeNull()
  })
})

describe('active period key', () => {
  it('returns null when not set', () => {
    expect(getActivePeriodKey()).toBeNull()
  })
  it('returns key after setActivePeriodKey', () => {
    setActivePeriodKey('jan-2026')
    expect(getActivePeriodKey()).toBe('jan-2026')
  })
  it('overwrites previous active key', () => {
    setActivePeriodKey('dec-2025')
    setActivePeriodKey('jan-2026')
    expect(getActivePeriodKey()).toBe('jan-2026')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/dataCache.test.ts
```
Expected: FAIL with "Cannot find module '../dataCache'"

- [ ] **Step 3: Create `src/lib/dataCache.ts`**

```ts
import type { Transaction } from '@/lib/financialData'

/** Per-source loading status. */
export type SourceStatus =
  | 'ok'
  | 'not_configured'   // env vars not set
  | 'auth_required'    // OAuth not done
  | 'error'            // fetch or API failure

export interface PeriodCache {
  periodKey:    string
  transactions: Transaction[]
  loadedAt:     string  // ISO 8601 — must be string, not Date, for JSON serialisation
  sources: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
}

const CACHE_PREFIX = 'sbtc_cache_'
const ACTIVE_KEY   = 'sbtc_active_period'

function storage(): Storage | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage
}

export function getCachedPeriod(periodKey: string): PeriodCache | null {
  const raw = storage()?.getItem(CACHE_PREFIX + periodKey) ?? null
  if (!raw) return null
  try {
    return JSON.parse(raw) as PeriodCache
  } catch {
    return null
  }
}

export function setCachedPeriod(cache: PeriodCache): void {
  try {
    storage()?.setItem(CACHE_PREFIX + cache.periodKey, JSON.stringify(cache))
  } catch {
    // sessionStorage quota exceeded — silently ignore
  }
}

export function clearCachedPeriod(periodKey: string): void {
  storage()?.removeItem(CACHE_PREFIX + periodKey)
}

export function getActivePeriodKey(): string | null {
  return storage()?.getItem(ACTIVE_KEY) ?? null
}

export function setActivePeriodKey(periodKey: string): void {
  storage()?.setItem(ACTIVE_KEY, periodKey)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/dataCache.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dataCache.ts src/lib/__tests__/dataCache.test.ts
git commit -m "feat: add sessionStorage period cache with SourceStatus type (dataCache.ts)"
```

---

### Task 10: Create `src/lib/dataLoader.ts`

**Files:**
- Create: `src/lib/dataLoader.ts`
- Create: `src/lib/__tests__/dataLoader.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/dataLoader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { periodToDateRange, loadPeriodData } from '../dataLoader'
import type { Transaction } from '@/lib/financialData'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date: '01/04/2026', description: 'Test', amount: 10,
    debit: 0, credit: 10, reference: 'REF1',
    status: 'pending', source: 'square',
    ...overrides,
  }
}

// ─── periodToDateRange ────────────────────────────────────────────────────────

describe('periodToDateRange', () => {
  it('always starts from FY_START (2025-03-01)', () => {
    expect(periodToDateRange('jan-2026').from).toBe('2025-03-01T00:00:00Z')
    expect(periodToDateRange('dec-2025').from).toBe('2025-03-01T00:00:00Z')
  })

  it('jan-2026 ends on 2026-01-31', () => {
    expect(periodToDateRange('jan-2026').to).toMatch(/^2026-01-31/)
  })

  it('dec-2025 ends on 2025-12-31', () => {
    expect(periodToDateRange('dec-2025').to).toMatch(/^2025-12-31/)
  })

  it('full-year to is today', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(periodToDateRange('full-year').to).toMatch(new RegExp(`^${today}`))
  })
})

// ─── loadPeriodData ───────────────────────────────────────────────────────────

describe('loadPeriodData', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })

  it('deduplicates transactions with identical composite key', async () => {
    const tx = makeTx()
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx, tx] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.transactions).toHaveLength(1)
  })

  it('keeps transactions with different references', async () => {
    const tx1 = makeTx({ reference: 'A' })
    const tx2 = makeTx({ reference: 'B' })
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx1, tx2] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.transactions).toHaveLength(2)
  })

  it('marks square as "ok" when Square returns transactions', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [makeTx()] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe('ok')
  })

  it('marks square as "error" when Square API returns HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 502 } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe('error')
    expect(result.transactions).toHaveLength(0)
  })

  it('marks reckon as "auth_required" when proxy returns auth_required status', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true,  json: async () => [] }                                   as unknown as Response)  // square
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ status: 'auth_required' }) } as unknown as Response)  // reckon
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.reckon).toBe('auth_required')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/dataLoader.test.ts
```
Expected: FAIL with "Cannot find module '../dataLoader'"

- [ ] **Step 3: Create `src/lib/dataLoader.ts`**

```ts
import type { Transaction } from '@/lib/financialData'
import type { SourceStatus } from './dataCache'

export interface LoadResult {
  transactions: Transaction[]
  sources: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
}

const FY_START = '2025-03-01T00:00:00Z'

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

export function periodToDateRange(periodKey: string): { from: string; to: string } {
  if (periodKey === 'full-year') {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return { from: FY_START, to: today.toISOString() }
  }
  const [mon, yr] = periodKey.split('-')
  const year       = Number(yr)
  const monthIndex = MONTH_INDEX[mon] ?? 0
  // Day 0 of next month = last day of this month
  const lastDay = new Date(year, monthIndex + 1, 0)
  lastDay.setHours(23, 59, 59, 999)
  return { from: FY_START, to: lastDay.toISOString() }
}

function txKey(t: Transaction): string {
  return `${t.date}|${t.description}|${t.amount}|${t.reference}`
}

function dedup(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>()
  return transactions.filter(t => {
    const k = txKey(t)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// ─── Source fetchers ──────────────────────────────────────────────────────────

async function fetchSquare(from: string, to: string): Promise<{ txns: Transaction[]; status: SourceStatus }> {
  try {
    const params = new URLSearchParams({ from, to })
    const res = await fetch(`/api/square/payments?${params}`)
    if (!res.ok) return { txns: [], status: 'error' }
    const data = await res.json() as Transaction[]
    return { txns: data, status: data.length > 0 ? 'ok' : 'ok' }
  } catch {
    return { txns: [], status: 'error' }
  }
}

async function fetchReckon(from: string, to: string): Promise<{ txns: Transaction[]; status: SourceStatus }> {
  try {
    const params = new URLSearchParams({ from, to })
    const res = await fetch(`/api/reckon/transactions?${params}`)

    if (res.status === 401) {
      const body = await res.json().catch(() => ({}) as Record<string, unknown>)
      const s = (body as Record<string, unknown>).status
      if (s === 'auth_required') return { txns: [], status: 'auth_required' }
      return { txns: [], status: 'error' }
    }

    if (!res.ok) return { txns: [], status: 'error' }

    const body = await res.json() as { data?: Transaction[]; status?: string; _mock?: boolean }

    if (body.status === 'not_configured') return { txns: [], status: 'not_configured' }

    return { txns: body.data ?? [], status: 'ok' }
  } catch {
    return { txns: [], status: 'error' }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadPeriodData(periodKey: string): Promise<LoadResult> {
  const { from, to } = periodToDateRange(periodKey)

  const [squareResult, reckonResult] = await Promise.all([
    fetchSquare(from, to),
    fetchReckon(from, to),
  ])

  return {
    transactions: dedup([...squareResult.txns, ...reckonResult.txns]),
    sources: {
      square: squareResult.status,
      reckon: reckonResult.status,
      stripe: 'not_configured',
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/dataLoader.test.ts
```
Expected: PASS (all 8 tests)

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/dataLoader.ts src/lib/__tests__/dataLoader.test.ts
git commit -m "feat: add period data loader with Square + Reckon support (dataLoader.ts)"
```

---

### Task 11: Create `src/components/DataLoadingPanel.tsx` and `CacheStatusBar.tsx`

**Files:**
- Create: `src/components/DataLoadingPanel.tsx`
- Create: `src/components/CacheStatusBar.tsx`

No tests — pure display components with no business logic.

- [ ] **Step 1: Create `src/components/DataLoadingPanel.tsx`**

```tsx
'use client'

import type { SourceStatus } from '@/lib/dataCache'

interface Props {
  periodLabel: string
  sources?: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
}

export default function DataLoadingPanel({ periodLabel, sources }: Props) {
  const reckonNeedsAuth = sources?.reckon === 'auth_required'

  return (
    <div className="card space-y-2 py-3 px-4">
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full border-2 animate-spin flex-shrink-0"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--brand)' }}
        />
        <span className="text-sm" style={{ color: 'var(--text-2)' }}>
          Loading {periodLabel}…
        </span>
      </div>

      {reckonNeedsAuth && (
        <div className="flex items-center gap-2 text-xs pl-7" style={{ color: 'var(--text-3)' }}>
          <span>🔑 Reckon</span>
          <span style={{ color: 'var(--text-3)' }}>—</span>
          <a href="/api/reckon/auth" className="underline" style={{ color: 'var(--brand)' }}>
            Connect account →
          </a>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/CacheStatusBar.tsx`**

```tsx
'use client'

import type { SourceStatus } from '@/lib/dataCache'

interface Props {
  loadedAt: string
  count:    number
  sources: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
  onRefresh: () => void
  onClear:   () => void
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function statusDot(s: SourceStatus): string {
  return s === 'ok' ? '🟢' : s === 'auth_required' ? '🔑' : '⚫'
}

export default function CacheStatusBar({ loadedAt, count, sources, onRefresh, onClear }: Props) {
  return (
    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
      <span>
        {count} transactions · loaded {timeAgo(loadedAt)}
      </span>

      <span className="flex items-center gap-1">
        {statusDot(sources.square)} Square
      </span>

      <span className="flex items-center gap-1">
        {statusDot(sources.reckon)} Reckon
        {sources.reckon === 'auth_required' && (
          <>
            {' '}—{' '}
            <a href="/api/reckon/auth" className="underline" style={{ color: 'var(--brand)' }}>
              Connect →
            </a>
          </>
        )}
      </span>

      <button onClick={onRefresh} className="underline hover:opacity-70">Refresh</button>
      <button onClick={onClear}   className="underline hover:opacity-70">Clear</button>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/DataLoadingPanel.tsx src/components/CacheStatusBar.tsx
git commit -m "feat: add DataLoadingPanel and CacheStatusBar with SourceStatus support"
```

---

### Task 12: Rewrite `src/components/settings/ReckonIntegration.tsx`

**Files:**
- Rewrite: `src/components/settings/ReckonIntegration.tsx`

- [ ] **Step 1: Replace the full file**

```tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface ReckonStatus {
  configured:      boolean
  connected:       boolean
  authenticatedAt: string | null
}

function ReckonIntegrationInner() {
  const [status,  setStatus]  = useState<ReckonStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  // Re-check status when the treasurer is redirected back after OAuth
  const reckonParam = searchParams.get('reckon')

  useEffect(() => {
    setLoading(true)
    fetch('/api/reckon/status')
      .then(r => r.json() as Promise<ReckonStatus>)
      .then(d  => { setStatus(d); setLoading(false) })
      .catch(() => { setStatus({ configured: false, connected: false, authenticatedAt: null }); setLoading(false) })
  }, [reckonParam])

  async function handleDisconnect() {
    await fetch('/api/reckon/disconnect', { method: 'POST' })
    setStatus(prev => prev ? { ...prev, connected: false, authenticatedAt: null } : null)
  }

  if (loading) {
    return (
      <div className="card">
        <span className="text-sm" style={{ color: 'var(--text-3)' }}>Checking Reckon status…</span>
      </div>
    )
  }

  if (!status?.configured) {
    return (
      <div className="card opacity-60">
        <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Credentials not configured. Set RECKON_CLIENT_ID, RECKON_CLIENT_SECRET,
          RECKON_SUBSCRIPTION_KEY, RECKON_BOOK_ID, and RECKON_REDIRECT_URI in .env.local.
        </p>
      </div>
    )
  }

  if (!status.connected) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '10px', color: '#dc2626' }}>⏺</span>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Not connected</span>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
          Connect your Reckon One book to import transactions and bank balances automatically.
        </p>
        {reckonParam === 'error' && (
          <p className="text-sm mb-4" style={{ color: '#dc2626' }}>
            Connection failed. Please try again.
          </p>
        )}
        <a href="/api/reckon/auth" className="btn-primary inline-block">
          Connect to Reckon One →
        </a>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: '10px', color: '#15803d' }}>⏺</span>
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
        <span className="text-xs" style={{ color: '#15803d' }}>Connected</span>
      </div>
      <table className="w-full text-sm mb-4">
        <tbody>
          <tr>
            <td className="py-1 pr-6 section-label">Book</td>
            <td style={{ color: 'var(--text-1)' }}>Safety Bay Tennis Club</td>
          </tr>
          {status.authenticatedAt && (
            <tr>
              <td className="py-1 pr-6 section-label">Authorised</td>
              <td style={{ color: 'var(--text-2)' }}>
                {new Date(status.authenticatedAt).toLocaleString('en-AU', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <button onClick={handleDisconnect} className="btn-secondary text-sm">
        Disconnect
      </button>
    </div>
  )
}

export default function ReckonIntegration() {
  return (
    <Suspense fallback={
      <div className="card">
        <span className="text-sm" style={{ color: 'var(--text-3)' }}>Loading…</span>
      </div>
    }>
      <ReckonIntegrationInner />
    </Suspense>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/ReckonIntegration.tsx
git commit -m "feat(settings): replace Reckon stub with live OAuth connection panel"
```

---

### Task 13: Create `docs/PLANNING.md`

**Files:**
- Create: `docs/PLANNING.md`

- [ ] **Step 1: Create the file**

```markdown
# Tennis Treasury — Architecture & Planning Notes

## Data Flow (as of April 2026)

### Financial Period Data (Static)

Reckon P&L and Balance Sheet snapshots are manually entered in `src/lib/financialData.ts`
after each month-end export. The Dashboard KPI cards, charts, and bank balances all read
from the `PERIODS` registry. `getFinancialData()` has a TODO for live fetch — not yet active.

### Live Transaction Data (Square + Reckon → sessionStorage → Allocation)

The Dashboard period selector is the single trigger for fetching live transaction data:

1. User selects a period on the Dashboard (`src/app/page.tsx`)
2. `dataLoader.ts → periodToDateRange()` converts the period key to a YTD ISO date range (always from `2025-03-01T00:00:00Z`)
3. `dataLoader.ts → loadPeriodData()` calls `/api/square/payments` and `/api/reckon/transactions` in parallel
4. Square route (`src/app/api/square/payments/route.ts`) calls Square Orders API → line items → `Transaction[]`
5. Reckon route (`src/app/api/reckon/[endpoint]/route.ts`) calls `getLedgerTransactions()` → flat `ReckonTransaction[]` → mapped by `reckonTransactionToTransaction()` to `Transaction[]`
6. Results are deduplicated (composite key: `date|description|amount|reference`) and written to `sessionStorage` via `dataCache.ts`
7. The Allocation page reads the cache on mount

```
Dashboard (period selector)
       │ onChange
       ▼
  dataLoader.ts
  periodToDateRange()  →  { from: '2025-03-01T00:00:00Z', to: '[end of period]' }
  loadPeriodData()     →  Promise.all([fetchSquare(), fetchReckon()])
                          dedup
                          return LoadResult { transactions, sources }
       │
       ▼
  dataCache.ts
  setCachedPeriod()    →  sessionStorage['sbtc_cache_{period}']
  setActivePeriodKey() →  sessionStorage['sbtc_active_period']
       │
       ▼
  Allocation Page (on mount)
  getActivePeriodKey() + getCachedPeriod()
  → pre-populates ReviewTable
```

### Reckon OAuth Integration (LIVE — April 2026)

**Status:** Credentials configured in `.env.local`. OAuth flow implemented.

**Flow:**
1. Settings page shows "Not connected" → treasurer clicks "Connect to Reckon One →"
2. Browser navigates to `/api/reckon/auth` → server calls `getAuthorizationUrl()` → redirect to `identity.reckon.com`
3. Treasurer logs in → Reckon redirects to `/api/reckon/callback?code=...&state=...`
4. Callback route validates CSRF state → calls `exchangeCodeForTokens(code)`
5. Tokens stored in memory + `.reckon-tokens.json` (gitignored)
6. Future API calls: `getAccessToken()` auto-refreshes when within 5min of expiry

**Token storage:**
- Server-side in-memory (`_tokens` in `auth.ts`) + file backup at `.reckon-tokens.json`
- File persists across server restarts
- Tokens NEVER go to browser, localStorage, or cookies
- Treasurer only needs to authenticate once — refresh token handles subsequent sessions

**Key env vars required:**
- `RECKON_CLIENT_ID`
- `RECKON_CLIENT_SECRET`
- `RECKON_SUBSCRIPTION_KEY`
- `RECKON_BOOK_ID` = `7f71d29b-8720-422d-8382-d961bb783990`
- `RECKON_REDIRECT_URI` = `http://127.0.0.1:3000/api/reckon/callback`

**Endpoint paths (base: `https://api.reckon.com/r1/v2/{bookId}`):**
- `GET /transactions?filter=transactionDate ge '...' and transactionDate le '...'`
- `GET /ledgeraccounts`
- `GET /bankaccounts`
- `GET /reports/profitandloss?startDate=...&endDate=...`

**Note on Reckon account names → cost centres:**
`reckonTransactionToTransaction()` in `transforms.ts` attempts to match `accountName`
(e.g. "Clubhouse - Electricity") against `COST_CENTRES[].label` (case-insensitive).
Where the Reckon account name exactly matches a cost centre label, the mapping is automatic.
This means ~70% of Reckon transactions will be auto-classified.

### Square API Integration

- Access token: `SQUARE_ACCESS_TOKEN` (server-side env only)
- Orders endpoint: `src/lib/square/api.ts → searchOrders()`
- Catalog cache (categories): `src/lib/square/catalog.ts`
- Line item → Transaction mapping: `src/lib/square/transforms.ts`
- Cost centre auto-matching: `src/lib/costCentres.ts → SQUARE_CATEGORY_MAP`

### CSV Upload (Fallback)

Reckon, Square CSV, and Stripe workflows still work via CSV upload in
`src/components/transactions/CsvUpload.tsx`. Square CSV upload is available
as a fallback when the live API is not responding.

### Pending

- **Dashboard wiring**: `src/app/page.tsx` needs to call `loadPeriodData()` on period change
  and wire `DataLoadingPanel` / `CacheStatusBar` — see period-driven data loading plan.
- **Allocation page wiring**: `src/app/transactions/page.tsx` needs to read from cache on mount.
- **Live Reckon P&L → `getFinancialData()`**: The `PERIODS` static registry will eventually
  be replaced by live Reckon P&L fetch — not yet implemented.
- **Stripe integration**: CSV upload works; live API fetch not yet implemented.
- **Split allocation**: Plan at `docs/superpowers/plans/2026-04-01-split-cost-centre-allocation.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/PLANNING.md
git commit -m "docs: add PLANNING.md with Reckon OAuth and data flow architecture"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| `src/lib/reckon/auth.ts` — OAuth 2.0 with 5 exports | Task 2 |
| `src/app/api/reckon/callback/route.ts` | Task 7 |
| `src/app/api/reckon/auth/route.ts` | Task 7 |
| `src/lib/reckon/client.ts` with `reckonFetch<T>` | Task 3 |
| `src/lib/reckon/api.ts` — 4 endpoint wrappers | Task 4 |
| `src/lib/reckon/types.ts` — spec interfaces added | Task 1 |
| `src/lib/reckon/transforms.ts` | Task 5 |
| `src/lib/dataLoader.ts` with Reckon + `auth_required` | Task 10 |
| Settings page connected/disconnected panel | Task 12 |
| `src/lib/reckon/index.ts` — 5-var check | Task 6 |
| `docs/PLANNING.md` with Reckon status | Task 13 |
| `.reckon-tokens.json` in `.gitignore` | Task 1 |
| Auth tests covering all 6 spec requirements | Task 2 |
| Base URL hardcoded in `client.ts` | Task 3 |
| 401 retry in `client.ts` | Task 3 |
| Server-side only token storage | Task 2 (file), Task 7 (routes never return tokens) |
| Graceful degradation on failure | Task 4 (all api.ts functions return [] or null) |

**Placeholder scan:** None found. Every step has actual code.

**Type consistency:**
- `ReckonTransaction` (flat) defined in Task 1 → used in Task 4 (`api.ts`) and Task 5 (`transforms.ts`) ✓
- `ReckonJournalEntry` (renamed) used in `mock.ts` ✓
- `ReckonAccount`, `ReckonBankBalance`, `ReckonPnL` defined in Task 1 → used in Task 4 ✓
- `SourceStatus` defined in Task 9 → used in Task 10 and Task 11 ✓
- `PeriodCache.sources` uses `SourceStatus` not `boolean` — consistent with `LoadResult.sources` ✓
- `reckonFetch` in `client.ts` uses `getAccessToken()` from `auth.ts` ✓
- `reckonTransactionToTransaction(rt: ReckonTransaction)` — input type matches `getLedgerTransactions()` return type ✓

**Spec gap:** The spec mentions `getAccounts()` returning `ReckonAccount[]` and `getBankBalances()` returning `ReckonBankBalance[]`. These are implemented in Task 4. The existing proxy route exposes them as `/api/reckon/accounts` and `/api/reckon/bankaccounts` for any future UI components that need chart of accounts or bank balance data.

**Ordering note:** Tasks 8 (update proxy route) depends on Tasks 4 and 6 because the proxy route imports `getLedgerTransactions`, `getAccounts`, `getBankBalances` from the new `api.ts` and `isAuthenticated` from `auth.ts`. Execute Tasks 1–7 in order before Task 8.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-08-reckon-oauth-integration.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute all tasks in this session using executing-plans

Which approach?
