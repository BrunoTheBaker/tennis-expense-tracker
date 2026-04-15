import { describe, it, expect } from 'vitest'
import {
  getCurrentPeriod,
  generatePeriodOptions,
  periodToDateRange,
} from '@/lib/periods'

// Fixed reference date: 9 April 2026 (the current date at time of writing)
const APRIL_2026 = new Date(2026, 3, 9)  // month is 0-indexed

// ── 1. getCurrentPeriod ───────────────────────────────────────────────────────

describe('getCurrentPeriod', () => {
  it('returns yyyy-mm for the given date', () => {
    expect(getCurrentPeriod(APRIL_2026)).toBe('2026-04')
  })

  it('returns yyyy-mm for a July date (start of SBTC FY)', () => {
    expect(getCurrentPeriod(new Date(2025, 6, 1))).toBe('2025-07')
  })
})

// ── 2. generatePeriodOptions ──────────────────────────────────────────────────

describe('generatePeriodOptions', () => {
  it('returns exactly 2 groups: Financial Years then Monthly', () => {
    const groups = generatePeriodOptions(APRIL_2026)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('Financial Years')
    expect(groups[1].label).toBe('Monthly')
  })

  it('monthly group has exactly 24 options', () => {
    const groups = generatePeriodOptions(APRIL_2026)
    expect(groups[1].options).toHaveLength(24)
  })

  it('monthly options start with current month and are newest-first', () => {
    const groups  = generatePeriodOptions(APRIL_2026)
    const monthly = groups[1].options
    expect(monthly[0].value).toBe('2026-04')
    expect(monthly[0].label).toBe('April 2026')
    expect(monthly[23].value).toBe('2024-05')
    expect(monthly[23].label).toBe('May 2024')
  })

  it('FY group first option is current-FY with correct label', () => {
    const groups = generatePeriodOptions(APRIL_2026)
    const fyOpts = groups[0].options
    expect(fyOpts[0].value).toBe('current-FY')
    expect(fyOpts[0].label).toBe('Current Financial Year')
  })

  it('FY group second option is prior FY with en-dash label', () => {
    const groups = generatePeriodOptions(APRIL_2026)
    const fyOpts = groups[0].options
    // Apr 2026: current FY ends June 2026 → prior FY is 2025-FY = 2024–25
    expect(fyOpts[1].value).toBe('2025-FY')
    expect(fyOpts[1].label).toBe('2024\u201325 Financial Year')
  })
})

// ── 3. periodToDateRange ──────────────────────────────────────────────────────

describe('periodToDateRange', () => {
  it('converts a monthly key to an inclusive date range', () => {
    expect(periodToDateRange('2026-04')).toEqual({
      from: '2026-04-01',
      to:   '2026-04-30',
    })
  })

  it('converts a FY key to the correct Jul–Jun range', () => {
    expect(periodToDateRange('2025-FY')).toEqual({
      from: '2024-07-01',
      to:   '2025-06-30',
    })
  })

  it('handles February in a leap year correctly', () => {
    expect(periodToDateRange('2024-02')).toEqual({
      from: '2024-02-01',
      to:   '2024-02-29',
    })
  })
})
