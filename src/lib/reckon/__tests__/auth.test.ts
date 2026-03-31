import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAccessToken, _resetTokenCache } from '../auth'
import { isReckonConfigured } from '../index'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchToken(accessToken = 'test-token-123', expiresIn = 3600) {
  return vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ access_token: accessToken, expires_in: expiresIn }),
    text: async () => '',
  })
}

// ─── getAccessToken ───────────────────────────────────────────────────────────

describe('getAccessToken', () => {
  beforeEach(() => {
    _resetTokenCache()
    vi.restoreAllMocks()
  })

  it('fetches a token on first call', async () => {
    const fetchMock = mockFetchToken('first-token')
    vi.stubGlobal('fetch', fetchMock)

    const token = await getAccessToken()

    expect(token).toBe('first-token')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('identity.reckon.com'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('returns cached token on second call without re-fetching', async () => {
    const fetchMock = mockFetchToken('cached-token')
    vi.stubGlobal('fetch', fetchMock)

    const first  = await getAccessToken()
    const second = await getAccessToken()

    expect(first).toBe('cached-token')
    expect(second).toBe('cached-token')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-fetches when cached token is expired', async () => {
    // First fetch — token expires in 1 second (effectively immediately)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'old-token', expires_in: 0 }),
        text: async () => '',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'new-token', expires_in: 3600 }),
        text: async () => '',
      })
    vi.stubGlobal('fetch', fetchMock)

    await getAccessToken()        // populates cache with expiresAt ≈ now
    const second = await getAccessToken()  // should detect expiry and re-fetch

    expect(second).toBe('new-token')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws when the auth endpoint returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }))

    await expect(getAccessToken()).rejects.toThrow('Reckon auth failed (401)')
  })
})

// ─── isReckonConfigured ───────────────────────────────────────────────────────

describe('isReckonConfigured', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    Object.assign(process.env, originalEnv)
  })

  it('returns false when all vars are placeholder values', () => {
    process.env.RECKON_CLIENT_ID     = 'YOUR_CLIENT_ID'
    process.env.RECKON_CLIENT_SECRET = 'YOUR_CLIENT_SECRET'
    process.env.RECKON_BOOK_ID       = 'YOUR_BOOK_ID'

    expect(isReckonConfigured()).toBe(false)
  })

  it('returns false when vars are not set', () => {
    delete process.env.RECKON_CLIENT_ID
    delete process.env.RECKON_CLIENT_SECRET
    delete process.env.RECKON_BOOK_ID

    expect(isReckonConfigured()).toBe(false)
  })

  it('returns false when only some vars are real', () => {
    process.env.RECKON_CLIENT_ID     = 'real-client-id'
    process.env.RECKON_CLIENT_SECRET = 'YOUR_CLIENT_SECRET' // still placeholder
    process.env.RECKON_BOOK_ID       = 'real-book-id'

    expect(isReckonConfigured()).toBe(false)
  })

  it('returns true when all vars are real non-placeholder values', () => {
    process.env.RECKON_CLIENT_ID     = 'real-client-id'
    process.env.RECKON_CLIENT_SECRET = 'real-client-secret'
    process.env.RECKON_BOOK_ID       = 'real-book-id'

    expect(isReckonConfigured()).toBe(true)
  })
})
