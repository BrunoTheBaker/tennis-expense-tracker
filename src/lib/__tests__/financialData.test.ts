import { describe, it, expect } from 'vitest'
import { JAN_2026, getTotalIncome, getTotalExpenses, getNetPosition } from '@/lib/financialData'

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
