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

  it('matches accountName to a cost centre ledgerCode via COST_CENTRES label', () => {
    // "Clubhouse - Electricity" has ledgerCode '6-1203' in costCentres.ts
    const t = reckonTransactionToTransaction(makeRt({ accountName: 'Clubhouse - Electricity' }))
    expect(t.accountCode).toBe('6-1203')
  })

  it('sets accountCode to undefined when accountName has no matching cost centre', () => {
    const t = reckonTransactionToTransaction(makeRt({ accountName: 'Unknown Account XYZ' }))
    expect(t.accountCode).toBeUndefined()
  })
})
