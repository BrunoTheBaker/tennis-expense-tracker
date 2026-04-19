import { describe, it, expect, vi, beforeEach } from 'vitest'

// Must be hoisted before imports — mock server-only so it doesn't throw in tests
vi.mock('server-only', () => ({}))

// Mock node:fs to avoid writing .reckon-tokens.json during tests
vi.mock('node:fs', () => ({
  existsSync:   vi.fn(() => false),
  readFileSync:  vi.fn(() => ''),
  writeFileSync: vi.fn(),
  unlinkSync:    vi.fn(),
}))

import {
  isAuthenticated,
  getAuthenticatedAt,
  getAccessToken,
  getAuthorizationUrl,
  validateState,
  exchangeCodeForTokens,
  clearTokens,
  _resetTokenCache,
} from '../auth'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockTokenResponse(overrides: Partial<{
  access_token: string
  refresh_token: string
  expires_in: number
  ok: boolean
}> = {}) {
  return vi.fn().mockResolvedValueOnce({
    ok:   overrides.ok   ?? true,
    json: async () => ({
      access_token:  overrides.access_token  ?? 'access-token',
      refresh_token: overrides.refresh_token ?? 'refresh-token',
      expires_in:    overrides.expires_in    ?? 3600,
    }),
    text: async () => 'error body',
  })
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetTokenCache()
  vi.restoreAllMocks()
})

// ── 1. isAuthenticated ────────────────────────────────────────────────────────

describe('isAuthenticated', () => {
  it('returns false when no tokens are stored', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns true after exchangeCodeForTokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse())
    await exchangeCodeForTokens('code')
    expect(isAuthenticated()).toBe(true)
  })

  it('returns false after clearTokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse())
    await exchangeCodeForTokens('code')
    clearTokens()
    expect(isAuthenticated()).toBe(false)
  })
})

// ── 2. getAuthorizationUrl ────────────────────────────────────────────────────

describe('getAuthorizationUrl', () => {
  it('returns a URL pointing to identity.reckon.com', () => {
    process.env.RECKON_CLIENT_ID    = 'client123'
    process.env.RECKON_REDIRECT_URI = 'https://example.com/callback'

    const url = getAuthorizationUrl()
    expect(url).toContain('https://identity.reckon.com/connect/authorize')
    expect(url).toContain('client_id=client123')
    expect(url).toContain('response_type=code')
    expect(url).toContain('redirect_uri=')
  })

  it('includes state and nonce in the URL', () => {
    const url = getAuthorizationUrl()
    const params = new URL(url).searchParams
    expect(params.get('state')).toBeTruthy()
    expect(params.get('nonce')).toBeTruthy()
  })

  it('stores a state value that validateState can verify', () => {
    const url   = getAuthorizationUrl()
    const state = new URL(url).searchParams.get('state')!
    expect(validateState(state)).toBe(true)
  })
})

// ── 3. validateState ──────────────────────────────────────────────────────────

describe('validateState', () => {
  it('returns false when no state is pending', () => {
    expect(validateState('anything')).toBe(false)
  })

  it('returns false for the wrong state value', () => {
    getAuthorizationUrl()  // sets _pendingState
    expect(validateState('wrong-state')).toBe(false)
  })

  it('is one-time use — returns false on second call with same value', () => {
    const url   = getAuthorizationUrl()
    const state = new URL(url).searchParams.get('state')!
    expect(validateState(state)).toBe(true)
    expect(validateState(state)).toBe(false)
  })
})

// ── 4. exchangeCodeForTokens ──────────────────────────────────────────────────

describe('exchangeCodeForTokens', () => {
  it('calls the token endpoint with grant_type=authorization_code', async () => {
    const mockFetch = mockTokenResponse()
    vi.stubGlobal('fetch', mockFetch)

    await exchangeCodeForTokens('my-code')

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('identity.reckon.com/connect/token')
    const body = new URLSearchParams(opts.body as string)
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('my-code')
  })

  it('uses Basic auth in the Authorization header', async () => {
    process.env.RECKON_CLIENT_ID     = 'cid'
    process.env.RECKON_CLIENT_SECRET = 'csecret'
    const mockFetch = mockTokenResponse()
    vi.stubGlobal('fetch', mockFetch)

    await exchangeCodeForTokens('code')

    const [, opts] = mockFetch.mock.calls[0]
    const expected = 'Basic ' + Buffer.from('cid:csecret').toString('base64')
    expect((opts.headers as Record<string, string>)['Authorization']).toBe(expected)
  })

  it('throws when the token endpoint returns a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok:     false,
      status: 400,
      text:   async () => 'invalid_grant',
    }))

    await expect(exchangeCodeForTokens('bad-code')).rejects.toThrow('400')
  })
})

// ── 5. getAccessToken ─────────────────────────────────────────────────────────

describe('getAccessToken', () => {
  it('throws when not authenticated', async () => {
    await expect(getAccessToken()).rejects.toThrow('Not authenticated')
  })

  it('returns the access token when authenticated and not near expiry', async () => {
    vi.stubGlobal('fetch', mockTokenResponse({ access_token: 'my-token', expires_in: 3600 }))
    await exchangeCodeForTokens('code')

    await expect(getAccessToken()).resolves.toBe('my-token')
  })

  it('refreshes the token when within 5 minutes of expiry', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({  // initial exchange — token expires in 4 min 59 sec
        ok:   true,
        json: async () => ({
          access_token:  'old-token',
          refresh_token: 'refresh-token',
          expires_in:    299,
        }),
      })
      .mockResolvedValueOnce({  // refresh call
        ok:   true,
        json: async () => ({
          access_token:  'new-token',
          refresh_token: 'new-refresh',
          expires_in:    3600,
        }),
      })
    )

    await exchangeCodeForTokens('code')
    const token = await getAccessToken()
    expect(token).toBe('new-token')
  })
})

// ── 6. getAuthenticatedAt ─────────────────────────────────────────────────────

describe('getAuthenticatedAt', () => {
  it('returns null when not authenticated', () => {
    expect(getAuthenticatedAt()).toBeNull()
  })

  it('returns an ISO string after exchanging tokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse())
    await exchangeCodeForTokens('code')

    const at = getAuthenticatedAt()
    expect(at).toBeTruthy()
    expect(new Date(at!).getFullYear()).toBeGreaterThanOrEqual(2025)
  })
})
