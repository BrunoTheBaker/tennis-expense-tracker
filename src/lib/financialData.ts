// ─── Types ───────────────────────────────────────────────────────────────────

export interface Transaction {
  date: string          // DD/MM/YYYY
  description: string
  debit: number
  credit: number
  amount: number        // credit - debit (positive = income, negative = expense)
  reference: string
  accountCode?: string  // assigned cost centre code e.g. '6-1402'
  confidence?: 'high' | 'medium' | 'low'
  status: 'pending' | 'confirmed' | 'skipped'
  source?: 'reckon' | 'square' | 'stripe'
  // Square-specific fields (undefined for non-Square transactions)
  orderId?: string          // groups line items from the same terminal tap
  squareCategory?: string   // Square catalog category name e.g. 'Sunday Social'
  squareItemName?: string   // Square catalog item name e.g. 'Day Fee'
  squareItemId?: string     // Square catalog_object_id (variation ID)
}

export interface PnLCategory {
  code: string
  name: string
  income: number
  expenses: number
}

export interface BalanceSheetLine {
  name: string
  code?: string
  amount: number
  section: 'current_assets' | 'non_current_assets' | 'current_liabilities' | 'non_current_liabilities' | 'equity'
}

export interface DrinksPOSData {
  periodStart: string
  periodEnd: string
  sales: number
  openingStock: number
  purchases: number
  closingStock: number
  cogs: number
  profit: number
  grossProfitPct: number
}

export interface FinancialPeriod {
  label: string     // e.g. "1 March 2025 to 31 January 2026"
  asAtDate: string  // e.g. "31 January 2026"
  pnl: PnLCategory[]
  balanceSheet: BalanceSheetLine[]
  drinksPOS: DrinksPOSData
}

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getTotalIncome(period: FinancialPeriod): number {
  return period.pnl.reduce((sum, c) => sum + c.income, 0)
}

export function getTotalExpenses(period: FinancialPeriod): number {
  return period.pnl.reduce((sum, c) => sum + c.expenses, 0)
}

/**
 * Returns cost of goods sold (drinks only in Phase 1).
 * COGS is tracked in drinksPOS, not in the pnl categories,
 * because Reckon reports it in a separate section between
 * Income and Operating Expenses.
 */
export function getTotalCOGS(period: FinancialPeriod): number {
  return period.drinksPOS.cogs
}

/**
 * Net Position = Income − Operating Expenses − COGS
 * Mirrors the Reckon P&L structure:
 *   Income              $105,528.77
 *   Less COGS             $4,951.11
 *   Less Expenses        $63,424.13
 *   Net Position         $37,153.53
 */
export function getNetPosition(period: FinancialPeriod): number {
  return getTotalIncome(period) - getTotalExpenses(period) - getTotalCOGS(period)
}

// ─── Dec 2025 Actuals (YTD: 1 Mar 2025 – 31 Dec 2025) ───────────────────────
// Source: Reckon P&L + Balance Sheet reports (validation docs in Monthly/06 Dec 2025/Reports/)
// Drinks POS derived: Opening Stock + Purchases - Closing Stock = COGS from P&L

export const DEC_2025: FinancialPeriod = {
  label: '1 March 2025 to 31 December 2025',
  asAtDate: '31 December 2025',

  pnl: [
    { code: '4-0600', name: 'Junior Program',    income: 870.02,   expenses: 604.40 },
    { code: '4-0100', name: 'Memberships',        income: 18458.39, expenses: 4029.30 },
    { code: '4-7000', name: 'Coaching Income',    income: 4013.00,  expenses: 1433.00 },
    { code: '4-6000', name: 'Events',             income: 5624.20,  expenses: 6418.91 },
    { code: '4-0400', name: 'Tournaments',        income: 4980.90,  expenses: 3260.59 },
    { code: '4-0300', name: 'Pennants',           income: 6787.48,  expenses: 4829.01 },
    { code: '4-0200', name: 'Social Sessions',    income: 7516.25,  expenses: 1945.40 },
    { code: '4-9000', name: 'Other Income',       income: 32030.48, expenses: 0 },
    { code: '4-0500', name: 'Court Hire',         income: 8247.62,  expenses: 0 },
    { code: '4-4011', name: 'Drink Sales',        income: 6721.62,  expenses: 0 },
    { code: '4-8001', name: 'Interest Received',  income: 98.58,    expenses: 0 },
    { code: '6-1200', name: 'Clubhouse',          income: 0,        expenses: 17685.71 },
    { code: '6-1300', name: 'Courts',             income: 0,        expenses: 5720.02 },
    { code: '6-1400', name: 'Grounds',            income: 0,        expenses: 7001.39 },
    { code: '6-7000', name: 'Other Expenditure',  income: 0,        expenses: 5279.64 },
    { code: '6-1100', name: 'Membership Costs',   income: 0,        expenses: 0 },
  ],

  balanceSheet: [
    // Current Assets
    { name: 'Building Fundraiser Term Deposit',  amount: 38959.47, section: 'current_assets' },
    { name: 'Bank - Cards Petty Cash',           amount: 533.63,   section: 'current_assets' },
    { name: 'Bank - Building Fund',              amount: 10011.85, section: 'current_assets' },
    { name: 'Bank - Asset Renewal Term Deposit', amount: 60898.92, section: 'current_assets' },
    { name: 'Bank - Asset Renewal Account',      amount: 32222.74, section: 'current_assets' },
    { name: 'Bank - Trading Account',            amount: 38484.22, section: 'current_assets' },
    { name: 'Accounts Receivable', code: '1-1210', amount: -43.04,   section: 'current_assets' },
    { name: 'Uniform Stock',       code: '1-1302', amount: 405.00,   section: 'current_assets' },
    { name: 'Drinks Stock',        code: '1-1301', amount: 2018.88,  section: 'current_assets' },
    // Non-Current Assets
    { name: 'Playground and Shade Sails',         amount: 23850.50, section: 'non_current_assets' },
    { name: 'Court Booking System Infrastructure',amount: 20738.21, section: 'non_current_assets' },
    { name: 'Plant and Equipment', code: '1-7120', amount: 11934.28, section: 'non_current_assets' },
    // Equity
    { name: 'Opening Balance Equity', code: '3-0100', amount: 98700.01,  section: 'equity' },
    { name: 'Retained Earnings',      code: '3-1000', amount: 106735.83, section: 'equity' },
    { name: 'Current Year Earnings',               amount: 34578.82,  section: 'equity' },
  ],

  drinksPOS: {
    periodStart:    '01/03/2025',
    periodEnd:      '31/12/2025',
    sales:          6721.62,
    openingStock:   818.08,
    purchases:      3798.15,  // derived: COGS + closingStock - openingStock
    closingStock:   2018.88,
    cogs:           2597.35,
    profit:         4124.27,
    grossProfitPct: 61,
  },
}

// ─── Jan 2026 Actuals (YTD: 1 Mar 2025 – 31 Jan 2026) ───────────────────────
// Source: Reckon P&L reports exported 24 March 2026
// Balance Sheet: manually updated — update each month from Reckon export

export const JAN_2026: FinancialPeriod = {
  label: '1 March 2025 to 31 January 2026',
  asAtDate: '31 January 2026',

  pnl: [
    { code: '4-0600', name: 'Junior Program',             income: 870.02,    expenses: 1442.43 },
    { code: '4-0100', name: 'Memberships',                income: 19036.34,  expenses: 4029.30 },
    { code: '4-7000', name: 'Coaching Income',            income: 4418.00,   expenses: 1433.00 },
    { code: '4-6000', name: 'Events',                     income: 5635.20,   expenses: 6449.21 },
    { code: '4-0400', name: 'Tournaments',                income: 4980.90,   expenses: 3260.59 },
    { code: '4-0300', name: 'Pennants',                   income: 6787.48,   expenses: 4829.01 },
    { code: '4-0200', name: 'Social Sessions',            income: 8526.25,   expenses: 1945.40 },
    { code: '4-9000', name: 'Other Income',               income: 33945.76,  expenses: 0 },
    { code: '4-0500', name: 'Court Hire',                 income: 9400.60,   expenses: 0 },
    { code: '4-4011', name: 'Drink Sales',                income: 7834.95,   expenses: 0 },
    { code: '4-8001', name: 'Interest Received',          income: 4093.27,   expenses: 0 },
    { code: '6-1200', name: 'Clubhouse',                  income: 0,         expenses: 18634.92 },
    { code: '6-1300', name: 'Courts',                     income: 0,         expenses: 5720.02 },
    { code: '6-1400', name: 'Grounds',                    income: 0,         expenses: 9591.39 },
    { code: '6-7000', name: 'Other Expenditure',          income: 0,         expenses: 6088.86 },
    { code: '6-1100', name: 'Membership Costs',           income: 0,         expenses: 0 },
  ],

  balanceSheet: [
    // Current Assets
    { name: 'Building Fundraiser Term Deposit', amount: 40517.85,  section: 'current_assets' },
    { name: 'Bank - Cards Petty Cash',          amount: 1289.57,   section: 'current_assets' },
    { name: 'Bank - Building Fund',             amount: 10011.93,  section: 'current_assets' },
    { name: 'Bank - Asset Renewal Term Deposit',amount: 63334.88,  section: 'current_assets' },
    { name: 'Bank - Asset Renewal Account',     amount: 32223.01,  section: 'current_assets' },
    { name: 'Bank - Trading Account',           amount: 37918.31,  section: 'current_assets' },
    { name: 'Accounts Receivable',    code: '1-1210', amount: -43.04,    section: 'current_assets' },
    { name: 'Uniform Stock',          code: '1-1302', amount: 455.00,    section: 'current_assets' },
    { name: 'Drinks Stock',           code: '1-1301', amount: 358.87,    section: 'current_assets' },
    // Non-Current Assets
    { name: 'Playground and Shade Sails',        amount: 23850.50,  section: 'non_current_assets' },
    { name: 'Court Booking System Infrastructure',amount: 20738.21, section: 'non_current_assets' },
    { name: 'Plant and Equipment', code: '1-7120', amount: 11934.28, section: 'non_current_assets' },
    // Equity
    { name: 'Opening Balance Equity',  code: '3-0100', amount: 98700.01,  section: 'equity' },
    { name: 'Retained Earnings',       code: '3-1000', amount: 106735.83, section: 'equity' },
    { name: 'Current Year Earnings',                   amount: 37153.53,  section: 'equity' },
  ],

  drinksPOS: {
    periodStart: '01/03/2025',
    periodEnd:   '31/01/2026',
    sales:          7834.95,
    openingStock:   818.08,
    purchases:      4491.90,
    closingStock:   358.87,
    cogs:           4951.11,
    profit:         2883.84,
    grossProfitPct: 37,
  },
}

// ─── Period registry ─────────────────────────────────────────────────────────
// Add a new entry here each month after exporting from Reckon.
// Keys format: 'mmm-yyyy' lowercase, e.g. 'feb-2026'
// Values are YTD FinancialPeriod snapshots (1 March 2025 → end of month).

export const PERIODS: Record<string, FinancialPeriod> = {
  'jan-2026': JAN_2026,
  'dec-2025': DEC_2025,
}

export const PERIOD_LABELS: Record<string, string> = {
  'jan-2026': 'January 2026',
  'dec-2025': 'December 2025',
}

/** The most recent period key — used as the "Full Year" default. */
export const LATEST_PERIOD_KEY = 'jan-2026'

/**
 * Returns period keys ordered most-recent first (for the dropdown).
 * Add entries to PERIODS above; this function needs no changes.
 */
export function getOrderedPeriodKeys(): string[] {
  // Month order within the FY (Mar=0 … Feb=11)
  const FY_ORDER: Record<string, number> = {
    mar: 0, apr: 1, may: 2, jun: 3, jul: 4, aug: 5,
    sep: 6, oct: 7, nov: 8, dec: 9, jan: 10, feb: 11,
  }
  return Object.keys(PERIODS).sort((a, b) => {
    const [aM, aY] = a.split('-')
    const [bM, bY] = b.split('-')
    const yearDiff = Number(bY) - Number(aY)
    if (yearDiff !== 0) return yearDiff
    return (FY_ORDER[bM] ?? 0) - (FY_ORDER[aM] ?? 0)
  })
}

// ─── Single seam for UI data fetching ────────────────────────────────────────
//
// The UI should call getFinancialData(key) instead of reading PERIODS directly.
// When Reckon credentials are configured this will switch to live API data;
// until then it falls back to the static snapshots above.
//
// // TODO: RECKON API — implement live fetch from /api/reckon/* once credentials
// arrive and the Reckon → FinancialPeriod mapping is confirmed.

export async function getFinancialData(periodKey: string): Promise<FinancialPeriod | null> {
  // Dynamic import keeps the Reckon module server-side only in RSC contexts.
  // In client components this falls back to static data (isReckonConfigured = false).
  let configured = false
  try {
    const { isReckonConfigured } = await import('./reckon/index')
    configured = isReckonConfigured()
  } catch {
    // reckon module not available on client — use static data
  }

  if (!configured) {
    const key = periodKey === 'full-year'
      ? (await import('./financialData')).LATEST_PERIOD_KEY
      : periodKey
    return PERIODS[key] ?? null
  }

  // TODO: RECKON API — fetch live period data and map to FinancialPeriod shape.
  // For now fall through to static data even when configured.
  console.warn('[getFinancialData] Live Reckon fetch not yet implemented — using static data')
  const key = periodKey === 'full-year' ? LATEST_PERIOD_KEY : periodKey
  return PERIODS[key] ?? null
}

// ─── Square integration ───────────────────────────────────────────────────────

/** Returns true when SQUARE_ACCESS_TOKEN is set to a non-placeholder value. */
export function isSquareConfigured(): boolean {
  const token = process.env.SQUARE_ACCESS_TOKEN
  return !!token && token !== 'YOUR_PRODUCTION_ACCESS_TOKEN'
}

/**
 * Fetch Square payments for a date range via the server-side proxy route.
 * Returns [] with a console.warn if Square is not configured.
 */
export async function getSquareTransactions(
  from: string,
  to: string
): Promise<Transaction[]> {
  if (!isSquareConfigured()) {
    console.warn('[getSquareTransactions] SQUARE_ACCESS_TOKEN not configured — skipping')
    return []
  }

  try {
    const params = new URLSearchParams({ from, to })
    const res = await fetch(`/api/square/payments?${params}`)
    if (!res.ok) {
      console.warn('[getSquareTransactions] API error', res.status)
      return []
    }
    const data = await res.json() as Transaction[]
    return data
  } catch (err) {
    console.warn('[getSquareTransactions] fetch failed:', err)
    return []
  }
}
