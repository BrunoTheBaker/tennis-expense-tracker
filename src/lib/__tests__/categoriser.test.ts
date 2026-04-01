import { describe, it, expect } from 'vitest'
import { suggestCostCentres } from '../categoriser'
import type { Transaction } from '@/lib/financialData'

function makeTx(description: string, extra: Partial<Transaction> = {}): Transaction {
  return {
    description, amount: 10, debit: 0, credit: 10,
    date: '01/01/2026', reference: 'ref', status: 'pending',
    ...extra,
  }
}

describe('suggestCostCentres', () => {
  it('electricity match — SYNERGY ELECTRICITY POWER ENERGY UTILITY returns 6-1203 with high confidence', () => {
    // 'electricity', 'synergy', 'power', 'energy', 'utility', 'electric' all match → 6/8 = 0.75
    const results = suggestCostCentres(makeTx('SYNERGY ELECTRICITY POWER ENERGY UTILITY BPAY'))
    const match = results.find(r => r.costCentre.ledgerCode === '6-1203')
    expect(match).toBeDefined()
    expect(match!.confidence).toBe('high')
  })

  it('coffee shop no match — STARBUCKS COFFEE SHOP returns empty array', () => {
    const results = suggestCostCentres(makeTx('STARBUCKS COFFEE SHOP'))
    expect(results).toEqual([])
  })

  it('trophy/prize match — PERPETUAL TROPHY AWARD PRIZE returns 6-1702 with medium or high confidence', () => {
    // 'perpetual', 'trophy', 'award', 'prize' match → 4/8 = 0.5 (medium)
    const results = suggestCostCentres(makeTx('PERPETUAL TROPHY AWARD PRIZE'))
    const match = results.find(r => r.costCentre.ledgerCode === '6-1702')
    expect(match).toBeDefined()
    expect(['medium', 'high']).toContain(match!.confidence)
  })

  it('max 3 results — description hitting many cost centres returns at most 3 suggestions', () => {
    // Hits 4-0101, 4-0102, 4-0201, 4-0205, 4-0207, 4-6000 above threshold
    const results = suggestCostCentres(
      makeTx('membership annual fee registration adult senior stripe member fee social monday session fee gate event function dinner party')
    )
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('empty string returns empty array', () => {
    const results = suggestCostCentres(makeTx(''))
    expect(results).toEqual([])
  })

  it('score ordering — results are sorted by score descending', () => {
    // Use same multi-keyword description to guarantee multiple results
    const results = suggestCostCentres(
      makeTx('membership annual fee registration adult senior stripe member fee social monday session fee gate event function dinner party')
    )
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('mowing match — JIMS MOWING LAWN returns at least one suggestion with ledgerCode 6-1403', () => {
    // 'jims mowing', 'mowing', 'mow', 'lawn' all match → 4/11 ≈ 0.36 (just above MIN_SCORE 0.35)
    const results = suggestCostCentres(makeTx('JIMS MOWING LAWN'))
    const match = results.find(r => r.costCentre.ledgerCode === '6-1403')
    expect(match).toBeDefined()
  })
})

describe('suggestCostCentres — Square category signals', () => {
  it('returns high-confidence match for Sunday Social squareCategory', () => {
    const tx = makeTx('Sunday Social – Day Fee', { squareCategory: 'Sunday Social' })
    const results = suggestCostCentres(tx)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].costCentre.ledgerCode).toBe('4-0207')
    expect(results[0].confidence).toBe('high')
    expect(results[0].score).toBeGreaterThanOrEqual(0.9)
  })

  it('returns high-confidence match for Drinks squareCategory', () => {
    const tx = makeTx('Drinks – Soft Drink', { squareCategory: 'Drinks' })
    const results = suggestCostCentres(tx)
    expect(results[0].costCentre.ledgerCode).toBe('4-4011')
    expect(results[0].confidence).toBe('high')
  })

  it('falls back to description scoring when squareCategory has no mapping', () => {
    const tx = makeTx('SYNERGY ELECTRICITY POWER ENERGY UTILITY BPAY', {
      squareCategory: 'UnknownCategory',
    })
    const results = suggestCostCentres(tx)
    // Falls through to description keywords — electricity should still match
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].costCentre.ledgerCode).toBe('6-1203')
  })

  it('returns [] for empty description and no squareCategory', () => {
    expect(suggestCostCentres(makeTx(''))).toEqual([])
  })
})
