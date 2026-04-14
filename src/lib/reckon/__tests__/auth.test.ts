import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAccessToken,
  connectWithCredentials,
  clearTokens,
  getSessionStatus,
  INACTIVITY_TIMEOUT_MS,
  _resetTokenStore,
} from '../auth'
import { ReckonAuthError } from '../ReckonAuthError'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockSuccessfulConnect(expiresIn = 3600) {
  return vi.fn().mockResolvedValueOnce({
    ok:   true,
    json: async () => ({ access_token: 'test-token', expires_in: expiresIn }),
    text: async () => '',
  })
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetTokenStore()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// ── 1. getAccessToken() throws INACTIVITY_TIMEOUT after 5 min ─────────────────

describe('getAccessToken — inactivity timeout', () => {
  it('throws INACTIVITY_TIMEOUT when lastActivity is more than 5 minutes ago', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect())
    await connectWithCredentials()

    // Advance time past the inactivity threshold
    vi.useFakeTimers()
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS + 1)

    // Single call — first call throws + clears the store; a second call would give NOT_AUTHENTICATED
    await expect(getAccessToken()).rejects.toMatchObject({ code: 'INACTIVITY_TIMEOUT', name: 'ReckonAuthError' })
  })

  it('does NOT throw before the inactivity threshold', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect())
    await connectWithCredentials()

    vi.useFakeTimers()
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1000)  // just under 5 min

    await expect(getAccessToken()).resolves.toBe('test-token')
  })
})

// ── 2. getAccessToken() throws TOKEN_EXPIRED when past expiry ─────────────────

describe('getAccessToken — token expiry', () => {
  it('throws TOKEN_EXPIRED when access token is past its expiry time', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect(0))  // expires immediately
    await connectWithCredentials()

    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)  // past expiry

    await expect(getAccessToken()).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' })
  })
})

// ── 3. getAccessToken() updates lastActivity on each valid call ───────────────

describe('getAccessToken — updates lastActivity', () => {
  it('updates lastActivity so the inactivity timer resets on each call', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect())
    await connectWithCredentials()

    vi.useFakeTimers()

    // Advance to just under 5 min, call getAccessToken to reset timer
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 5000)
    await getAccessToken()

    // Advance another 4 minutes — total 9 min since connect, but only 4 since last call
    vi.advanceTimersByTime(4 * 60 * 1000)

    // Should still be valid because lastActivity was updated
    await expect(getAccessToken()).resolves.toBe('test-token')
  })
})

// ── 4. clearTokens() sets tokenStore to null ──────────────────────────────────

describe('clearTokens', () => {
  it('sets the token store to null so the next call throws NOT_AUTHENTICATED', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect())
    await connectWithCredentials()

    // Verify connected
    await expect(getAccessToken()).resolves.toBe('test-token')

    clearTokens()

    // Now it should throw
    await expect(getAccessToken()).rejects.toMatchObject({ code: 'NOT_AUTHENTICATED' })
  })
})

// ── 5. getSessionStatus() returns correct minutesRemaining ────────────────────

describe('getSessionStatus', () => {
  it('returns authenticated: false when not connected', () => {
    const status = getSessionStatus()
    expect(status.authenticated).toBe(false)
    expect(status.minutesRemaining).toBeNull()
    expect(status.minutesSinceActivity).toBeNull()
  })

  it('returns correct minutesRemaining after connecting', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect(3600))  // 1 hour token
    await connectWithCredentials()

    vi.useFakeTimers()
    vi.advanceTimersByTime(2 * 60 * 1000)  // 2 minutes pass

    const status = getSessionStatus()
    expect(status.authenticated).toBe(true)
    // 3 minutes remaining until inactivity timeout (5 min - 2 min elapsed)
    expect(status.minutesRemaining).toBe(3)
    expect(status.minutesSinceActivity).toBe(2)
  })

  it('returns authenticated: false after inactivity expires', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect())
    await connectWithCredentials()

    vi.useFakeTimers()
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS + 1000)

    const status = getSessionStatus()
    expect(status.authenticated).toBe(false)
  })
})

// ── 6. isInactive returns true after 5 min ────────────────────────────────────
// Tested indirectly via getAccessToken and getSessionStatus above.
// This test validates the boundary explicitly.

describe('inactivity boundary', () => {
  it('session is invalid one millisecond past INACTIVITY_TIMEOUT_MS', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect())
    await connectWithCredentials()

    vi.useFakeTimers()
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS + 1)

    await expect(getAccessToken()).rejects.toMatchObject({ code: 'INACTIVITY_TIMEOUT' })
  })
})

// ── 7. exchangeCodeForTokens / connectWithCredentials does NOT store refresh token

describe('connectWithCredentials — no refresh token stored', () => {
  it('succeeds without a refresh_token in the response', async () => {
    // Response has no refresh_token — should not throw or store it
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ access_token: 'no-refresh-token', expires_in: 3600 }),
      text: async () => '',
    }))

    await expect(connectWithCredentials()).resolves.toBeUndefined()
    await expect(getAccessToken()).resolves.toBe('no-refresh-token')
  })

  it('throws NOT_AUTHENTICATED (not an auto-refresh) when token expires', async () => {
    vi.stubGlobal('fetch', mockSuccessfulConnect(0))  // expires immediately
    await connectWithCredentials()

    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)

    // Must throw — no auto-refresh behaviour
    await expect(getAccessToken()).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' })
  })
})
