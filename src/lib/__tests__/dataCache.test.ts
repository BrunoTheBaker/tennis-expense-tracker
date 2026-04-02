import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCachedPeriod, setCachedPeriod, clearCachedPeriod, getActivePeriodKey, setActivePeriodKey } from '../dataCache'
import type { PeriodCache } from '../dataCache'

const store: Record<string, string> = {}
const mockStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
  vi.stubGlobal('sessionStorage', mockStorage)
})

const SAMPLE: PeriodCache = {
  periodKey: 'jan-2026',
  transactions: [],
  loadedAt: '2026-04-01T10:00:00.000Z',
  sources: { square: true, reckon: false, stripe: false },
}

describe('getCachedPeriod', () => {
  it('returns null when no cache exists', () => {
    expect(getCachedPeriod('jan-2026')).toBeNull()
  })
  it('returns cached value after setCachedPeriod', () => {
    setCachedPeriod(SAMPLE)
    expect(getCachedPeriod('jan-2026')).toEqual(SAMPLE)
  })
  it('returns null after clearCachedPeriod', () => {
    setCachedPeriod(SAMPLE)
    clearCachedPeriod('jan-2026')
    expect(getCachedPeriod('jan-2026')).toBeNull()
  })
})

describe('active period key', () => {
  it('returns null when not set', () => {
    expect(getActivePeriodKey()).toBeNull()
  })
  it('returns key after setActivePeriodKey', () => {
    setActivePeriodKey('jan-2026')
    expect(getActivePeriodKey()).toBe('jan-2026')
  })
  it('overwrites previous active key', () => {
    setActivePeriodKey('dec-2025')
    setActivePeriodKey('jan-2026')
    expect(getActivePeriodKey()).toBe('jan-2026')
  })
})

describe('when sessionStorage is unavailable', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', undefined)
  })

  it('getCachedPeriod returns null without throwing', () => {
    expect(getCachedPeriod('jan-2026')).toBeNull()
  })

  it('setCachedPeriod completes without throwing', () => {
    expect(() => setCachedPeriod(SAMPLE)).not.toThrow()
  })

  it('clearCachedPeriod completes without throwing', () => {
    expect(() => clearCachedPeriod('jan-2026')).not.toThrow()
  })

  it('getActivePeriodKey returns null without throwing', () => {
    expect(getActivePeriodKey()).toBeNull()
  })

  it('setActivePeriodKey completes without throwing', () => {
    expect(() => setActivePeriodKey('jan-2026')).not.toThrow()
  })
})
