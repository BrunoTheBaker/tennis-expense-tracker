import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { periodToDateRange, loadPeriodData } from '../dataLoader'
import type { Transaction } from '@/lib/financialData'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date: '01/04/2026', description: 'Test', amount: 10,
    debit: 0, credit: 10, reference: 'REF1',
    status: 'pending', source: 'square',
    ...overrides,
  }
}

describe('periodToDateRange', () => {
  it('always starts from FY_START', () => {
    expect(periodToDateRange('jan-2026').from).toBe('2025-03-01T00:00:00Z')
    expect(periodToDateRange('dec-2025').from).toBe('2025-03-01T00:00:00Z')
  })

  it('jan-2026 ends on 2026-01-31', () => {
    expect(periodToDateRange('jan-2026').to).toMatch(/^2026-01-31/)
  })

  it('dec-2025 ends on 2025-12-31', () => {
    expect(periodToDateRange('dec-2025').to).toMatch(/^2025-12-31/)
  })

  it('full-year to is today', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(periodToDateRange('full-year').to).toMatch(new RegExp(`^${today}`))
  })

  it('throws for unknown period key', () => {
    expect(() => periodToDateRange('xyz-2026')).toThrow('Unknown period key: "xyz-2026"')
  })
})

describe('loadPeriodData', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('deduplicates transactions with identical composite key', async () => {
    const tx = makeTx()
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx, tx] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.transactions).toHaveLength(1)
  })

  it('keeps transactions with different references', async () => {
    const tx1 = makeTx({ reference: 'A' })
    const tx2 = makeTx({ reference: 'B' })
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx1, tx2] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.transactions).toHaveLength(2)
  })

  it('marks square source as true when transactions returned', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [makeTx()] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe(true)
  })

  it('marks square source as false when API returns empty array', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [] } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe(false)
  })

  it('marks square source as false and returns [] when API errors', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 502 } as unknown as Response)
    const result = await loadPeriodData('jan-2026')
    expect(result.sources.square).toBe(false)
    expect(result.transactions).toHaveLength(0)
  })
})
