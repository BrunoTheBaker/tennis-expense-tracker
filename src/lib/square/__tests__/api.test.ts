import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listPayments, searchOrders, formatMoney } from '@/lib/square/api'
import { squarePaymentToTransaction, squareLineItemToTransaction } from '@/lib/square/transforms'
import type { Order, OrderLineItem } from '@/lib/square/types'

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

// ─── listPayments: cursor pagination ────────────────────────────────────────

describe('listPayments', () => {
  it('follows cursor pagination and returns all payments', async () => {
    const page1 = {
      payments: [{ id: 'p1', amount_money: { amount: 1000, currency: 'AUD' }, status: 'COMPLETED', created_at: '2026-01-15T10:00:00Z', location_id: 'LOC1', source_type: 'CARD' }],
      cursor: 'next-page',
    }
    const page2 = {
      payments: [{ id: 'p2', amount_money: { amount: 2000, currency: 'AUD' }, status: 'COMPLETED', created_at: '2026-01-16T10:00:00Z', location_id: 'LOC1', source_type: 'CARD' }],
    }

    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(mockFetchResponse(page1))
      .mockResolvedValueOnce(mockFetchResponse(page2))

    const result = await listPayments('2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z')

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('p1')
    expect(result[1].id).toBe('p2')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

// ─── searchOrders: cursor pagination ────────────────────────────────────────

describe('searchOrders', () => {
  it('follows cursor pagination across 2 pages and returns all orders', async () => {
    const order1: Partial<Order> = {
      id: 'ord1', location_id: 'LOC1', state: 'COMPLETED',
      created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z',
      total_money: { amount: 400, currency: 'AUD' },
      line_items: [{
        uid: 'li1', name: 'Day Fee', quantity: '1', item_type: 'ITEM',
        base_price_money: { amount: 400, currency: 'AUD' },
        total_money: { amount: 400, currency: 'AUD' },
        catalog_object_id: 'VAR1',
      }],
    }
    const order2: Partial<Order> = {
      id: 'ord2', location_id: 'LOC1', state: 'COMPLETED',
      created_at: '2026-03-02T10:00:00Z', updated_at: '2026-03-02T10:00:00Z',
      total_money: { amount: 800, currency: 'AUD' },
      line_items: [{
        uid: 'li2', name: 'Drink', quantity: '1', item_type: 'ITEM',
        base_price_money: { amount: 800, currency: 'AUD' },
        total_money: { amount: 800, currency: 'AUD' },
        catalog_object_id: 'VAR2',
      }],
    }

    process.env.SQUARE_LOCATION_ID = 'LOC1'
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(mockFetchResponse({ orders: [order1], cursor: 'page2' }))
      .mockResolvedValueOnce(mockFetchResponse({ orders: [order2] }))

    const result = await searchOrders('2026-03-01T00:00:00Z', '2026-03-31T23:59:59Z')

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('ord1')
    expect(result[1].id).toBe('ord2')
  })
})

// ─── formatMoney ────────────────────────────────────────────────────────────

describe('formatMoney', () => {
  it('converts cent amounts to display strings', () => {
    expect(formatMoney({ amount: 2500, currency: 'AUD' })).toBe('$25.00')
    expect(formatMoney({ amount: 100,  currency: 'AUD' })).toBe('$1.00')
    expect(formatMoney({ amount: 0,    currency: 'AUD' })).toBe('$0.00')
  })
})

// ─── squarePaymentToTransaction ──────────────────────────────────────────────

describe('squarePaymentToTransaction', () => {
  it('maps a Square payment to the internal Transaction shape', () => {
    const tx = squarePaymentToTransaction({
      id: 'pay_abc', amount_money: { amount: 5000, currency: 'AUD' },
      status: 'COMPLETED', created_at: '2026-01-15T10:30:00Z',
      location_id: 'LOC1', source_type: 'CARD', note: 'Court hire',
    })

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

// ─── squareLineItemToTransaction ─────────────────────────────────────────────

describe('squareLineItemToTransaction', () => {
  it('maps cents to dollars, joins category and item name, uses order.id as reference', () => {
    const order: Order = {
      id: 'ord_xyz', location_id: 'LOC1', state: 'COMPLETED',
      created_at: '2026-03-29T06:00:00Z', updated_at: '2026-03-29T06:00:00Z',
      total_money: { amount: 400, currency: 'AUD' },
    }
    const lineItem: OrderLineItem = {
      uid: 'li1', name: 'Day Fee', quantity: '1', item_type: 'ITEM',
      variation_name: 'Regular',
      base_price_money: { amount: 400, currency: 'AUD' },
      total_money: { amount: 406, currency: 'AUD' },
      catalog_object_id: 'VAR1',
    }

    const tx = squareLineItemToTransaction(lineItem, order, 'Sunday Social')

    expect(tx.amount).toBe(4.00)
    expect(tx.credit).toBe(4.00)
    expect(tx.debit).toBe(0)
    expect(tx.description).toBe('Sunday Social – Day Fee')
    expect(tx.reference).toBe('ord_xyz')
    expect(tx.source).toBe('square')
    expect(tx.status).toBe('pending')
    expect(tx.date).toBe('29/03/2026')
  })

  it('uses item name alone when no category is available', () => {
    const order: Order = {
      id: 'ord_xyz', location_id: 'LOC1', state: 'COMPLETED',
      created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z',
      total_money: { amount: 800, currency: 'AUD' },
    }
    const lineItem: OrderLineItem = {
      uid: 'li2', name: 'Soft Drink', quantity: '1', item_type: 'ITEM',
      base_price_money: { amount: 800, currency: 'AUD' },
      total_money: { amount: 800, currency: 'AUD' },
    }

    const tx = squareLineItemToTransaction(lineItem, order, undefined)

    expect(tx.description).toBe('Soft Drink')
    expect(tx.amount).toBe(8.00)
  })
})

// ─── listPayments returns [] when env var missing ────────────────────────────

describe('listPayments — missing SQUARE_ACCESS_TOKEN', () => {
  it('returns [] and does not throw when token is absent', async () => {
    delete process.env.SQUARE_ACCESS_TOKEN
    const result = await listPayments('2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z')
    expect(result).toEqual([])
  })
})
