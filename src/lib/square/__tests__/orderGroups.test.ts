import { describe, it, expect } from 'vitest'
import { groupByOrder, getOrderSiblings, getOrderTotal } from '../orderGroups'
import type { Transaction } from '@/lib/financialData'

function makeTx(id: string, orderId: string, amount: number): Transaction {
  return {
    description: `Item ${id}`, date: '29/03/2026', debit: 0, credit: amount,
    amount, reference: orderId, status: 'pending', source: 'square', orderId,
  }
}

const txA1 = makeTx('a1', 'ord-A', 4.00)
const txA2 = makeTx('a2', 'ord-A', 4.50)
const txA3 = makeTx('a3', 'ord-A', 4.50)
const txB1 = makeTx('b1', 'ord-B', 8.00)
const txNoOrder: Transaction = {
  description: 'Cash', date: '01/01/2026', debit: 0, credit: 5,
  amount: 5, reference: 'ref', status: 'pending',
}

describe('groupByOrder', () => {
  it('groups transactions by orderId', () => {
    const map = groupByOrder([txA1, txA2, txA3, txB1])
    expect(map.get('ord-A')).toHaveLength(3)
    expect(map.get('ord-B')).toHaveLength(1)
  })

  it('omits transactions without orderId', () => {
    const map = groupByOrder([txA1, txNoOrder])
    expect(map.size).toBe(1)
    expect(map.has('ord-A')).toBe(true)
  })
})

describe('getOrderSiblings', () => {
  it('returns other transactions with the same orderId, excluding self', () => {
    const siblings = getOrderSiblings(txA1, [txA1, txA2, txA3, txB1])
    expect(siblings).toHaveLength(2)
    expect(siblings.some(t => t === txA1)).toBe(false)
  })

  it('returns [] when transaction has no orderId', () => {
    expect(getOrderSiblings(txNoOrder, [txA1, txNoOrder])).toEqual([])
  })

  it('does not include transactions from a different orderId', () => {
    const siblings = getOrderSiblings(txA1, [txA1, txA2, txB1])
    expect(siblings.every(t => t.orderId === 'ord-A')).toBe(true)
    expect(siblings).toHaveLength(1)  // only txA2, not txB1
  })
})

describe('getOrderTotal', () => {
  it('sums amounts of all transactions sharing the same orderId', () => {
    const total = getOrderTotal(txA1, [txA1, txA2, txA3, txB1])
    expect(total).toBeCloseTo(13.00)
  })

  it('returns the transaction amount alone when it has no siblings', () => {
    expect(getOrderTotal(txB1, [txB1])).toBeCloseTo(8.00)
  })
})
