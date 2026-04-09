import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock server-only so import doesn't throw in test environment ───────────────
vi.mock('server-only', () => ({}))

// ── Mock accountCache ─────────────────────────────────────────────────────────
vi.mock('../accountCache', () => ({
  getAccountsWithCache: vi.fn(),
}))

// ── Mock auth ─────────────────────────────────────────────────────────────────
vi.mock('../auth', () => ({
  createReckonClient: vi.fn(),
  RECKON_BOOK_ID:     'test-book-id',
}))

import { postTransaction, postTransactionBatch, retryFailed } from '../write'
import { getAccountsWithCache } from '../accountCache'
import { createReckonClient } from '../auth'
import type { Transaction } from '@/lib/financialData'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockAccounts = [
  { id: 'acc-4-0207', code: '4-0207', name: 'Sunday Social Tennis', type: 'Income' as const, isActive: true },
  { id: 'acc-4-4011', code: '4-4011', name: 'Drink Sales',          type: 'Income' as const, isActive: true },
]

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date:        '15/03/2025',
    description: 'Sunday Social – Day Fee',
    debit:       0,
    credit:      4.00,
    amount:      4.00,
    reference:   'SQ-ABC123',
    status:      'confirmed',
    source:      'square',
    accountCode: '4-0207',
    ...overrides,
  }
}

function mockPostSuccess(reckonId = 'reckon-txn-001') {
  vi.mocked(createReckonClient).mockResolvedValue({
    get:  vi.fn(),
    post: vi.fn().mockResolvedValue({ id: reckonId }),
  })
}

function mockPostError(message = 'Internal Server Error') {
  vi.mocked(createReckonClient).mockResolvedValue({
    get:  vi.fn(),
    post: vi.fn().mockRejectedValue(new Error(message)),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAccountsWithCache).mockResolvedValue(mockAccounts)
})

// ── 1. Continues after single failure ─────────────────────────────────────────

describe('postTransactionBatch', () => {
  it('continues posting after a single transaction fails', async () => {
    const t1 = makeTransaction({ reference: 'SQ-001' })
    const t2 = makeTransaction({ reference: 'SQ-002' })
    const t3 = makeTransaction({ reference: 'SQ-003' })

    // First call fails, second and third succeed
    vi.mocked(createReckonClient)
      .mockResolvedValueOnce({ get: vi.fn(), post: vi.fn().mockRejectedValue(new Error('timeout')) })
      .mockResolvedValueOnce({ get: vi.fn(), post: vi.fn().mockResolvedValue({ id: 'rk-002' }) })
      .mockResolvedValueOnce({ get: vi.fn(), post: vi.fn().mockResolvedValue({ id: 'rk-003' }) })

    const results = await postTransactionBatch([t1, t2, t3])

    expect(results).toHaveLength(3)
    expect(results[0].status).toBe('failed')
    expect(results[1].status).toBe('success')
    expect(results[2].status).toBe('success')
  })

  it('returns one result per input transaction', async () => {
    mockPostSuccess()
    const txns = [makeTransaction({ reference: 'A' }), makeTransaction({ reference: 'B' })]
    const results = await postTransactionBatch(txns)
    expect(results).toHaveLength(2)
  })
})

// ── 2. Never posts source === 'reckon' ────────────────────────────────────────

describe('postTransaction — source guard', () => {
  it('skips transactions where source is reckon', async () => {
    mockPostSuccess()
    const t = makeTransaction({ source: 'reckon' })
    const result = await postTransaction(t)

    expect(result.status).toBe('skipped')
    expect(result.error).toMatch(/already in Reckon/i)

    // createReckonClient should never have been called for a skipped transaction
    expect(vi.mocked(createReckonClient)).not.toHaveBeenCalled()
  })

  it('skips reckon-sourced transactions within a batch', async () => {
    const reckonTxn = makeTransaction({ reference: 'RK-001', source: 'reckon' })
    const squareTxn = makeTransaction({ reference: 'SQ-001', source: 'square' })

    vi.mocked(createReckonClient).mockResolvedValue({
      get:  vi.fn(),
      post: vi.fn().mockResolvedValue({ id: 'rk-new' }),
    })

    const results = await postTransactionBatch([reckonTxn, squareTxn])

    expect(results[0].status).toBe('skipped')
    expect(results[1].status).toBe('success')
  })
})

// ── 3. Skips already-posted transactions ──────────────────────────────────────

describe('postTransaction — duplicate guard', () => {
  it('skips a transaction where postedToReckon is true', async () => {
    mockPostSuccess()
    const t = makeTransaction({ postedToReckon: true, reckonId: 'existing-rk-id' })
    const result = await postTransaction(t)

    expect(result.status).toBe('skipped')
    expect(result.error).toMatch(/duplicate/i)
  })
})

// ── 4. Correct error message on failure ──────────────────────────────────────

describe('postTransaction — error propagation', () => {
  it('returns the error message from the thrown exception', async () => {
    mockPostError('Reckon API error (429): rate limit exceeded')
    const t      = makeTransaction()
    const result = await postTransaction(t)

    expect(result.status).toBe('failed')
    expect(result.error).toContain('rate limit exceeded')
  })

  it('never throws — always returns a PostResult', async () => {
    mockPostError('catastrophic failure')
    const t = makeTransaction()
    await expect(postTransaction(t)).resolves.toMatchObject({ status: 'failed' })
  })
})

// ── 5. Split transaction generates one post per split ─────────────────────────

describe('postTransaction — split transactions', () => {
  it('posts one Reckon transaction per split', async () => {
    const postFn = vi.fn()
      .mockResolvedValueOnce({ id: 'rk-split-1' })
      .mockResolvedValueOnce({ id: 'rk-split-2' })

    vi.mocked(createReckonClient).mockResolvedValue({ get: vi.fn(), post: postFn })

    const t = makeTransaction({
      isSplit: true,
      splits:  [
        { accountCode: '4-0207', amount: 4.00 },
        { accountCode: '4-4011', amount: 3.50 },
      ],
    })

    const result = await postTransaction(t)

    expect(result.status).toBe('success')
    expect(postFn).toHaveBeenCalledTimes(2)

    // First split uses suffix -1, second uses -2
    expect(postFn.mock.calls[0][1]).toMatchObject({ reference: expect.stringContaining('-1') })
    expect(postFn.mock.calls[1][1]).toMatchObject({ reference: expect.stringContaining('-2') })
    expect(result.reckonId).toBe('rk-split-1,rk-split-2')
  })
})

// ── 6. Account resolution fails gracefully ────────────────────────────────────

describe('postTransaction — account resolution', () => {
  it('returns failed status when no matching account exists for the cost centre', async () => {
    vi.mocked(getAccountsWithCache).mockResolvedValue([]) // empty — nothing matches

    const t      = makeTransaction({ accountCode: '4-9999' })
    const result = await postTransaction(t)

    expect(result.status).toBe('failed')
    expect(result.error).toMatch(/no matching reckon account/i)
    expect(result.error).toContain('4-9999')
  })

  it('includes the missing cost centre code in the error', async () => {
    vi.mocked(getAccountsWithCache).mockResolvedValue([
      { id: 'acc-4-0207', code: '4-0207', name: 'Sunday Social', type: 'Income' as const, isActive: true },
    ])

    const t      = makeTransaction({ accountCode: '4-0101' }) // not in mock accounts
    const result = await postTransaction(t)

    expect(result.status).toBe('failed')
    expect(result.error).toContain('4-0101')
  })
})

// ── retryFailed ───────────────────────────────────────────────────────────────

describe('retryFailed', () => {
  it('clears postedToReckon flag so the duplicate guard does not block retry', async () => {
    mockPostSuccess('rk-retry-001')

    const alreadyPosted = makeTransaction({ postedToReckon: true, reckonId: 'old-id' })
    const results       = await retryFailed([alreadyPosted])

    // With the flag cleared, it should attempt and succeed
    expect(results[0].status).toBe('success')
    expect(results[0].reckonId).toBe('rk-retry-001')
  })
})
