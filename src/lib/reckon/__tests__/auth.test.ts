import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAccessToken,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  isAuthenticated,
  clearTokens,
  validateState,
  getAuthenticatedAt,
  _resetTokenCache,
} from '../auth'
import { isReckonConfigured } from '../config'

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
    expect(fetchMock).toHaveBeenCalledTimes(1)
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
    const token = await getAccessToken()

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

// ─── getAuthenticatedAt ────────────────────────────────────────────────────────

describe('getAuthenticatedAt', () => {
  beforeEach(() => { _resetTokenCache(); vi.restoreAllMocks() })

  it('returns null when not authenticated', () => {
    expect(getAuthenticatedAt()).toBeNull()
  })

  it('returns ISO 8601 string after exchangeCodeForTokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse())
    await exchangeCodeForTokens('auth-code-123')
    const at = getAuthenticatedAt()
    expect(at).not.toBeNull()
    expect(typeof at).toBe('string')
    expect(new Date(at!).getTime()).not.toBeNaN()
  })

  it('returns null after clearTokens', async () => {
    vi.stubGlobal('fetch', mockTokenResponse())
    await exchangeCodeForTokens('auth-code-123')
    clearTokens()
    expect(getAuthenticatedAt()).toBeNull()
  })
})

// ─── isReckonConfigured ───────────────────────────────────────────────────────────

describe('isReckonConfigured', () => {
  const savedEnv = { ...process.env }

  afterEach(() => {
    // restore original env after each test
    for (const key of Object.keys(process.env)) {
      if (!(key in savedEnv)) delete process.env[key]
    }
    Object.assign(process.env, savedEnv)
  })

  it('returns false when RECKON_CLIENT_ID is missing', () => {
    delete process.env.RECKON_CLIENT_ID
    expect(isReckonConfigured()).toBe(false)
  })

  it('returns false when RECKON_SUBSCRIPTION_KEY is missing', () => {
    process.env.RECKON_CLIENT_ID     = 'real'
    process.env.RECKON_CLIENT_SECRET = 'real'
    process.env.RECKON_BOOK_ID       = 'real'
    process.env.RECKON_REDIRECT_URI  = 'http://localhost:3000/api/reckon/callback'
    delete process.env.RECKON_SUBSCRIPTION_KEY
    expect(isReckonConfigured()).toBe(false)
  })

  it('returns false when any var is a placeholder', () => {
    process.env.RECKON_CLIENT_ID         = 'YOUR_CLIENT_ID'
    process.env.RECKON_CLIENT_SECRET     = 'real'
    process.env.RECKON_SUBSCRIPTION_KEY  = 'real'
    process.env.RECKON_BOOK_ID           = 'real'
    process.env.RECKON_REDIRECT_URI      = 'http://localhost:3000/api/reckon/callback'
    expect(isReckonConfigured()).toBe(false)
  })

  it('returns true when all 5 vars are set to real non-placeholder values', () => {
    process.env.RECKON_CLIENT_ID         = 'real-client'
    process.env.RECKON_CLIENT_SECRET     = 'real-secret'
    process.env.RECKON_SUBSCRIPTION_KEY  = 'real-key'
    process.env.RECKON_BOOK_ID           = 'real-book'
    process.env.RECKON_REDIRECT_URI      = 'http://localhost:3000/api/reckon/callback'
    expect(isReckonConfigured()).toBe(true)
  })
})
