import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadPeriodData } from '../dataLoader'
import type { Transaction } from '@/lib/financialData'

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    date: '01/04/2026', description: 'Test', amount: 10,
    debit: 0, credit: 10, reference: 'REF1',
    status: 'pending', source: 'square',
    ...overrides,
  }
}

// ─── loadPeriodData ───────────────────────────────────────────────────────────

describe('loadPeriodData', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })

  it('deduplicates transactions with identical composite key', async () => {
    const tx = makeTx()
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx, tx] } as unknown as Response)
    const result = await loadPeriodData('2026-01')
    expect(result.transactions).toHaveLength(1)
  })

  it('keeps transactions with different references', async () => {
    const tx1 = makeTx({ reference: 'A' })
    const tx2 = makeTx({ reference: 'B' })
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [tx1, tx2] } as unknown as Response)
    const result = await loadPeriodData('2026-01')
    expect(result.transactions).toHaveLength(2)
  })

  it('marks square as "ok" when Square returns transactions', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [makeTx()] } as unknown as Response)
    const result = await loadPeriodData('2026-01')
    expect(result.sources.square).toBe('ok')
  })

  it('marks square as "error" when Square API returns HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 502 } as unknown as Response)
    const result = await loadPeriodData('2026-01')
    expect(result.sources.square).toBe('error')
    expect(result.transactions).toHaveLength(0)
  })

  it('marks reckon as "auth_required" when proxy returns auth_required status', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true,  json: async () => [] }                                         as unknown as Response)  // square
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ status: 'auth_required' }) } as unknown as Response)  // reckon
    const result = await loadPeriodData('2026-01')
    expect(result.sources.reckon).toBe('auth_required')
  })
})
