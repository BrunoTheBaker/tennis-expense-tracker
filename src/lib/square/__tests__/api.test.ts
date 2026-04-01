import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listPayments, formatMoney } from '@/lib/square/api'
import { squarePaymentToTransaction } from '@/lib/square/transforms'

// ─── helpers ────────────────────────────────────────────────────────────────

function mockFetchResponse(data: unknown, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(data),
  } as unknown as Response
}

// ─── setup / teardown ────────────────────────────────────────────────────────

const SAVED_TOKEN = process.env.SQUARE_ACCESS_TOKEN

beforeEach(() => {
  process.env.SQUARE_ACCESS_TOKEN = 'test-token'
})

afterEach(() => {
  vi.restoreAllMocks()
  if (SAVED_TOKEN !== undefined) {
    process.env.SQUARE_ACCESS_TOKEN = SAVED_TOKEN
  } else {
    delete process.env.SQUARE_ACCESS_TOKEN
  }
})

// ─── Test 1: listPayments follows cursor pagination ──────────────────────────

describe('listPayments', () => {
  it('follows cursor pagination and returns all payments', async () => {
    const page1 = {
      payments: [
        {
          id: 'p1',
          amount_money: { amount: 1000, currency: 'AUD' },
          status: 'COMPLETED',
          created_at: '2026-01-15T10:00:00Z',
          location_id: 'LOC1',
          source_type: 'CARD',
        },
      ],
      cursor: 'next-page',
    }
    const page2 = {
      payments: [
        {
          id: 'p2',
          amount_money: { amount: 2000, currency: 'AUD' },
          status: 'COMPLETED',
          created_at: '2026-01-16T10:00:00Z',
          location_id: 'LOC1',
          source_type: 'CARD',
        },
      ],
      // no cursor — final page
    }

    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(mockFetchResponse(page1))
      .mockResolvedValueOnce(mockFetchResponse(page2))

    const result = await listPayments('2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z')

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('p1')
    expect(result[1].id).toBe('p2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

// ─── Test 2: formatMoney converts cents ─────────────────────────────────────

describe('formatMoney', () => {
  it('converts cent amounts to display strings', () => {
    expect(formatMoney({ amount: 2500, currency: 'AUD' })).toBe('$25.00')
    expect(formatMoney({ amount: 100,  currency: 'AUD' })).toBe('$1.00')
    expect(formatMoney({ amount: 0,    currency: 'AUD' })).toBe('$0.00')
  })
})

// ─── Test 3: squarePaymentToTransaction maps correctly ───────────────────────

describe('squarePaymentToTransaction', () => {
  it('maps a Square payment to the internal Transaction shape', () => {
    const mockPayment = {
      id: 'pay_abc',
      amount_money: { amount: 5000, currency: 'AUD' },
      status: 'COMPLETED',
      created_at: '2026-01-15T10:30:00Z',
      location_id: 'LOC1',
      source_type: 'CARD',
      note: 'Court hire',
    }

    const tx = squarePaymentToTransaction(mockPayment)

    expect(tx.amount).toBe(50.00)
    expect(tx.credit).toBe(50.00)
    expect(tx.debit).toBe(0)
    expect(tx.source).toBe('square')
    expect(tx.reference).toBe('pay_abc')
    expect(tx.description).toBe('Court hire')
    expect(tx.status).toBe('pending')
    expect(tx.date).toBe('15/01/2026')
  })
})

// ─── Test 4: listPayments returns [] when env var missing ───────────────────

describe('listPayments — missing SQUARE_ACCESS_TOKEN', () => {
  it('returns [] and does not throw when token is absent', async () => {
    delete process.env.SQUARE_ACCESS_TOKEN

    const result = await listPayments('2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z')

    expect(result).toEqual([])
  })
})
