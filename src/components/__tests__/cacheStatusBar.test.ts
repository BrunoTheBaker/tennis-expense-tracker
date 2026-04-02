import { describe, it, expect, vi, afterEach } from 'vitest'
import { timeAgo } from '../CacheStatusBar'

afterEach(() => vi.useRealTimers())

describe('timeAgo', () => {
  it('returns "just now" for 0 minutes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T10:00:00Z'))
    expect(timeAgo('2026-04-01T10:00:00Z')).toBe('just now')
  })

  it('returns "just now" for negative delta (future timestamp / clock skew)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T10:00:00Z'))
    expect(timeAgo('2026-04-01T10:01:00Z')).toBe('just now')
  })

  it('returns minutes for < 60 mins', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T10:30:00Z'))
    expect(timeAgo('2026-04-01T10:00:00Z')).toBe('30m ago')
  })

  it('returns hours for >= 60 mins', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T12:00:00Z'))
    expect(timeAgo('2026-04-01T10:00:00Z')).toBe('2h ago')
  })

  it('returns "just now" for exactly 59 seconds (< 1 minute)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01T10:00:59Z'))
    expect(timeAgo('2026-04-01T10:00:00Z')).toBe('just now')
  })
})
