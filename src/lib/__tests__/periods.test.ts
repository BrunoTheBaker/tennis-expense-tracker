import { describe, it, expect, vi, afterEach } from 'vitest'
import { generatePeriodOptions, periodToDateRange, getCurrentPeriod } from '../periods'

// Pin to a known date: 9 April 2026 (within FY 2025-26: Jul 2025 – Jun 2026)
const FROZEN = new Date('2026-04-09T10:00:00Z')

describe('generatePeriodOptions', () => {
  afterEach(() => { vi.useRealTimers() })

  it('returns exactly 24 month options', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN)
    const months = generatePeriodOptions().filter(o => o.type === 'month')
    expect(months).toHaveLength(24)
  })

  it('first option is current month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN)
    const opts = generatePeriodOptions()
    expect(opts[0].value).toBe('2026-04')
    expect(opts[0].type).toBe('month')
  })

  it('last monthly option is 23 months ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN)
    const months = generatePeriodOptions().filter(o => o.type === 'month')
    expect(months[23].value).toBe('2024-05')
  })

  it('financial years use correct Jul–Jun boundaries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN)
    const fys = generatePeriodOptions().filter(o => o.type === 'financial-year')
    expect(fys).toHaveLength(2)
    // Current FY: Jul 2025 → today
    expect(fys[0].value).toBe('current-FY')
    expect(fys[0].from).toBe('2025-07-01T00:00:00Z')
    // Previous FY: Jul 2024 → Jun 2025
    expect(fys[1].value).toBe('2025-FY')
    expect(fys[1].from).toBe('2024-07-01T00:00:00Z')
    expect(fys[1].to).toBe('2025-06-30T23:59:59Z')
  })

  it('FY label shows en-dash not hyphen', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN)
    const fys = generatePeriodOptions().filter(o => o.type === 'financial-year')
    // '2024–25 Financial Year' — en-dash U+2013
    expect(fys[1].label).toBe('2024\u201325 Financial Year')
  })
})

describe('periodToDateRange', () => {
  it('2025-03 returns correct first/last day', () => {
    const { from, to } = periodToDateRange('2025-03')
    expect(from).toBe('2025-03-01T00:00:00Z')
    expect(to).toBe('2025-03-31T23:59:59Z')
  })

  it('handles leap year February 2024', () => {
    const { from, to } = periodToDateRange('2024-02')
    expect(from).toBe('2024-02-01T00:00:00Z')
    expect(to).toBe('2024-02-29T23:59:59Z')
  })

  it('handles non-leap year February', () => {
    const { from, to } = periodToDateRange('2025-02')
    expect(from).toBe('2025-02-01T00:00:00Z')
    expect(to).toBe('2025-02-28T23:59:59Z')
  })

  it('throws for unrecognised period value', () => {
    expect(() => periodToDateRange('jan-2026')).toThrow()
  })

  it('resolves current-FY from generated options', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN)
    const { from } = periodToDateRange('current-FY')
    expect(from).toBe('2025-07-01T00:00:00Z')
    vi.useRealTimers()
  })
})

describe('getCurrentPeriod', () => {
  afterEach(() => { vi.useRealTimers() })

  it('returns current month in YYYY-MM format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FROZEN)
    expect(getCurrentPeriod()).toBe('2026-04')
  })

  it('zero-pads single-digit months', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15'))
    expect(getCurrentPeriod()).toBe('2026-01')
  })
})
