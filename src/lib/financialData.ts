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
