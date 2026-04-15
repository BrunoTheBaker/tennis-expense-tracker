// ─── Types ───────────────────────────────────────────────────────────────────

export interface PeriodOption {
  value: string
  label: string
}

export interface PeriodOptionGroup {
  label: string
  options: PeriodOption[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Returns the financial year that ends in June.
 * e.g. for April 2026 → 2026 (FY Jul 2025–Jun 2026)
 *      for August 2025 → 2026 (FY Jul 2025–Jun 2026)
 */
function getFYYear(now: Date): number {
  const month = now.getMonth() + 1  // 1-indexed
  return month >= 7 ? now.getFullYear() + 1 : now.getFullYear()
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the period key for the current month, e.g. '2026-04'.
 */
export function getCurrentPeriod(now = new Date()): string {
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Returns option groups for the period selector.
 *
 * Group 1 — Financial Years: current FY + the immediately prior complete FY
 * Group 2 — Monthly: 24 months starting from the current month, newest first
 */
export function generatePeriodOptions(now = new Date()): PeriodOptionGroup[] {
  const fyYear     = getFYYear(now)
  const prevFYYear = fyYear - 1

  const fyOptions: PeriodOption[] = [
    { value: 'current-FY', label: 'Current Financial Year' },
    {
      value: `${prevFYYear}-FY`,
      label: `${prevFYYear - 1}\u2013${String(prevFYYear).slice(2)} Financial Year`,
    },
  ]

  const monthlyOptions: PeriodOption[] = []
  for (let i = 0; i < 24; i++) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year  = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    monthlyOptions.push({
      value: `${year}-${month}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${year}`,
    })
  }

  return [
    { label: 'Financial Years', options: fyOptions },
    { label: 'Monthly',         options: monthlyOptions },
  ]
}

/**
 * Converts a period key to an inclusive ISO date range.
 *
 *   'current-FY'  → current SBTC FY (1 Jul – 30 Jun)
 *   '2025-FY'     → { from: '2024-07-01', to: '2025-06-30' }
 *   '2026-04'     → { from: '2026-04-01', to: '2026-04-30' }
 */
export function periodToDateRange(key: string): { from: string; to: string } {
  if (key === 'current-FY') {
    const fyYear = getFYYear(new Date())
    return { from: `${fyYear - 1}-07-01`, to: `${fyYear}-06-30` }
  }

  if (key.endsWith('-FY')) {
    const year = parseInt(key.split('-')[0], 10)
    return { from: `${year - 1}-07-01`, to: `${year}-06-30` }
  }

  // Monthly: 'yyyy-mm'
  const [yearStr, monthStr] = key.split('-')
  const year     = parseInt(yearStr, 10)
  const month    = parseInt(monthStr, 10)
  const lastDay  = new Date(year, month, 0).getDate()  // day 0 of month+1 = last day of month
  return {
    from: `${yearStr}-${monthStr}-01`,
    to:   `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  }
}

// For test isolation (functions are pure via now-parameter injection — no state to reset)
export function _resetPeriodCache(): void {}
