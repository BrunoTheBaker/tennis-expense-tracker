import { describe, it, expect } from 'vitest'
import { suggestCostCentres } from '../categoriser'

describe('suggestCostCentres', () => {
  it('electricity match — SYNERGY ELECTRICITY POWER ENERGY UTILITY returns 6-1203 with high confidence', () => {
    // 'electricity', 'synergy', 'power', 'energy', 'utility', 'electric' all match → 6/8 = 0.75
    const results = suggestCostCentres('SYNERGY ELECTRICITY POWER ENERGY UTILITY BPAY')
    const match = results.find(r => r.costCentre.ledgerCode === '6-1203')
    expect(match).toBeDefined()
    expect(match!.confidence).toBe('high')
  })

  it('coffee shop no match — STARBUCKS COFFEE SHOP returns empty array', () => {
    const results = suggestCostCentres('STARBUCKS COFFEE SHOP')
    expect(results).toEqual([])
  })

  it('trophy/prize match — PERPETUAL TROPHY AWARD PRIZE returns 6-1702 with medium or high confidence', () => {
    // 'perpetual', 'trophy', 'award', 'prize' match → 4/8 = 0.5 (medium)
    const results = suggestCostCentres('PERPETUAL TROPHY AWARD PRIZE')
    const match = results.find(r => r.costCentre.ledgerCode === '6-1702')
    expect(match).toBeDefined()
    expect(['medium', 'high']).toContain(match!.confidence)
  })

  it('max 3 results — description hitting many cost centres returns at most 3 suggestions', () => {
    // Hits 4-0101, 4-0102, 4-0201, 4-0205, 4-0207, 4-6000 above threshold
    const results = suggestCostCentres(
      'membership annual fee registration adult senior stripe member fee social monday session fee gate event function dinner party'
    )
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('empty string returns empty array', () => {
    const results = suggestCostCentres('')
    expect(results).toEqual([])
  })

  it('score ordering — results are sorted by score descending', () => {
    // Use same multi-keyword description to guarantee multiple results
    const results = suggestCostCentres(
      'membership annual fee registration adult senior stripe member fee social monday session fee gate event function dinner party'
    )
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('mowing match — JIMS MOWING LAWN returns at least one suggestion with ledgerCode 6-1403', () => {
    // 'jims mowing', 'mowing', 'mow', 'lawn' all match → 4/11 ≈ 0.36 (just above MIN_SCORE 0.35)
    const results = suggestCostCentres('JIMS MOWING LAWN')
    const match = results.find(r => r.costCentre.ledgerCode === '6-1403')
    expect(match).toBeDefined()
  })
})
