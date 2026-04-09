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

beforeEach(() => vi.clearAllMocks())

// ─── getLedgerTransactions ────────────────────────────────────────────────────

describe('getLedgerTransactions', () => {
  it('returns array of ReckonTransaction when API succeeds with items key', async () => {
    vi.mocked(reckonFetch).mockResolvedValueOnce({
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
    vi.mocked(reckonFetch).mockResolvedValueOnce({ items: [] })
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
    vi.mocked(reckonFetch).mockResolvedValueOnce({
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
    vi.mocked(reckonFetch).mockResolvedValueOnce({
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
    vi.mocked(reckonFetch).mockResolvedValueOnce({
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
