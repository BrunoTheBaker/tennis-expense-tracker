import { describe, it, expect } from 'vitest'
import {
  JAN_2026,
  getTotalIncome,
  getTotalExpenses,
  getNetPosition,
  PERIODS,
  PERIOD_LABELS,
  LATEST_PERIOD_KEY,
  getOrderedPeriodKeys,
  DEC_2025,
} from '@/lib/financialData'

describe('financialData', () => {
  it('total income matches P&L report', () => {
    expect(getTotalIncome(JAN_2026)).toBeCloseTo(105528.77, 2)
  })

  it('total expenses matches P&L report', () => {
    expect(getTotalExpenses(JAN_2026)).toBeCloseTo(63424.13, 2)
  })

  it('net position matches P&L report', () => {
    expect(getNetPosition(JAN_2026)).toBeCloseTo(37153.53, 2)
  })

  it('balance sheet total assets correct', () => {
    const totalAssets = JAN_2026.balanceSheet
      .filter(l => l.section === 'current_assets' || l.section === 'non_current_assets')
      .reduce((sum, l) => sum + l.amount, 0)
    expect(totalAssets).toBeCloseTo(242589.37, 2)
  })

  it('drinks POS gross profit percent is 37%', () => {
    expect(JAN_2026.drinksPOS.grossProfitPct).toBe(37)
  })
})

describe('PERIODS map', () => {
  it('contains 2025-12 and 2026-01', () => {
    expect(PERIODS['2025-12']).toBeDefined()
    expect(PERIODS['2026-01']).toBeDefined()
  })

  it('LATEST_PERIOD_KEY is 2026-01', () => {
    expect(LATEST_PERIOD_KEY).toBe('2026-01')
  })

  it('PERIOD_LABELS has human-readable names', () => {
    expect(PERIOD_LABELS['2025-12']).toBe('December 2025')
    expect(PERIOD_LABELS['2026-01']).toBe('January 2026')
  })

  it('getOrderedPeriodKeys returns keys in reverse chronological order', () => {
    const keys = getOrderedPeriodKeys()
    expect(keys[0]).toBe('2026-01')
    expect(keys[1]).toBe('2025-12')
  })

  it('LATEST_PERIOD_KEY resolves to JAN_2026 in PERIODS', () => {
    const period = PERIODS[LATEST_PERIOD_KEY]
    expect(period).toBe(JAN_2026)
  })
})
