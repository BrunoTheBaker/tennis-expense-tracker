/**
 * Period options for the dashboard selector.
 * Generated from today's date — never hardcoded.
 * SBTC financial year: 1 July → 30 June.
 */

export interface PeriodOption {
  value: string  // e.g. '2025-03', '2025-FY', 'current-FY'
  label: string  // e.g. 'March 2025', '2024–25 Financial Year'
  from:  string  // ISO datetime e.g. '2025-03-01T00:00:00Z'
  to:    string  // ISO datetime e.g. '2025-03-31T23:59:59Z'
  type:  'month' | 'financial-year'
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of month+1 = last day of month (month is 1-based)
  return new Date(year, month, 0).getDate()
}

/**
 * Returns all period options in display order:
 *   1. Current month (top)
 *   2. Previous 23 months (newest first)
 *   3. Current financial year (or most recent)
 *   4. Previous financial year
 */
export function generatePeriodOptions(): PeriodOption[] {
  const today = new Date()
  const options: PeriodOption[] = []

  // ─── Monthly: last 24 months inclusive of current month ───────────────────
  for (let i = 0; i < 24; i++) {
    const d        = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year     = d.getFullYear()
    const month    = d.getMonth() + 1  // 1-based
    const lastDay  = lastDayOfMonth(year, month)
    options.push({
      value: `${year}-${pad(month)}`,
      label: d.toLocaleString('en-AU', { month: 'long', year: 'numeric' }),
      from:  `${year}-${pad(month)}-01T00:00:00Z`,
      to:    `${year}-${pad(month)}-${pad(lastDay)}T23:59:59Z`,
      type:  'month',
    })
  }

  // ─── Financial years: SBTC FY runs 1 July → 30 June ──────────────────────
  const todayYear  = today.getFullYear()
  const todayMonth = today.getMonth() + 1  // 1-based

  // fyStartYear: calendar year when the most-recent FY began (July)
  const fyStartYear = todayMonth >= 7 ? todayYear : todayYear - 1

  for (let i = 0; i < 2; i++) {
    const startYear  = fyStartYear - i
    const endYear    = startYear + 1
    const fyEndDate  = new Date(endYear, 5, 30)  // June 30 of end year
    const isCurrent  = i === 0 && today <= fyEndDate

    options.push({
      value: isCurrent ? 'current-FY' : `${endYear}-FY`,
      label: isCurrent
        ? 'Current Financial Year'
        : `${startYear}\u2013${String(endYear).slice(2)} Financial Year`,
      from:  `${startYear}-07-01T00:00:00Z`,
      to:    isCurrent
        ? `${todayYear}-${pad(todayMonth)}-${pad(today.getDate())}T23:59:59Z`
        : `${endYear}-06-30T23:59:59Z`,
      type: 'financial-year',
    })
  }

  return options
}

/**
 * Converts a period value to an ISO datetime range.
 * Handles generated values (e.g. '2026-04', 'current-FY', '2025-FY')
 * plus any YYYY-MM value outside the 24-month window.
 */
export function periodToDateRange(value: string): { from: string; to: string } {
  // Check generated options first (handles FY values and anything in the window)
  const found = generatePeriodOptions().find(p => p.value === value)
  if (found) return { from: found.from, to: found.to }

  // Fallback: accept any YYYY-MM directly
  const m = /^(\d{4})-(\d{2})$/.exec(value)
  if (m) {
    const year    = Number(m[1])
    const month   = Number(m[2])
    const lastDay = lastDayOfMonth(year, month)
    return {
      from: `${value}-01T00:00:00Z`,
      to:   `${value}-${pad(lastDay)}T23:59:59Z`,
    }
  }

  throw new Error(`Unknown period value: '${value}'`)
}

/** Returns the value for the current calendar month, e.g. '2026-04'. */
export function getCurrentPeriod(): string {
  const today = new Date()
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}`
}
