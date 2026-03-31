/**
 * Mock data based on actual SBTC FY 2025-26 actuals from Reckon.
 * Figures derived from JAN_2026 FinancialPeriod in financialData.ts.
 * January-specific figures = JAN_2026 delta over DEC_2025.
 */

import type { ReckonTransaction, Account, BankAccount, LedgerEntry } from './types'

// ─── Accounts — mirrors Master Chart of Accounts ──────────────────────────────

export const MOCK_ACCOUNTS: Account[] = [
  // Income
  { id: 'acc-4-0101', code: '4-0101', name: 'Memberships - Adult',             type: 'Income',      isActive: true },
  { id: 'acc-4-0102', code: '4-0102', name: 'Memberships - Junior',            type: 'Income',      isActive: true },
  { id: 'acc-4-0201', code: '4-0201', name: 'Monday Social Tennis',            type: 'Income',      isActive: true },
  { id: 'acc-4-0202', code: '4-0202', name: 'Wednesday Social Tennis',         type: 'Income',      isActive: true },
  { id: 'acc-4-0203', code: '4-0203', name: 'Thursday Social Tennis',          type: 'Income',      isActive: true },
  { id: 'acc-4-0205', code: '4-0205', name: 'Friday Social Tennis',            type: 'Income',      isActive: true },
  { id: 'acc-4-0206', code: '4-0206', name: 'Friday Night Social Tennis',      type: 'Income',      isActive: true },
  { id: 'acc-4-0207', code: '4-0207', name: 'Sunday Social Tennis',            type: 'Income',      isActive: true },
  { id: 'acc-4-0301', code: '4-0301', name: 'Pennants - Men\'s',               type: 'Income',      isActive: true },
  { id: 'acc-4-0302', code: '4-0302', name: 'Pennants - Ladies\'',             type: 'Income',      isActive: true },
  { id: 'acc-4-0401', code: '4-0401', name: 'Tournament Entry Fees',           type: 'Income',      isActive: true },
  { id: 'acc-4-0500', code: '4-0500', name: 'Court Hire',                      type: 'Income',      isActive: true },
  { id: 'acc-4-4011', code: '4-4011', name: 'Drink Sales',                     type: 'Income',      isActive: true },
  { id: 'acc-4-5001', code: '4-5001', name: 'Coaching Rent Income',            type: 'Income',      isActive: true },
  { id: 'acc-4-6000', code: '4-6000', name: 'Events',                          type: 'Income',      isActive: true },
  { id: 'acc-4-7000', code: '4-7000', name: 'Coaching Income',                 type: 'Income',      isActive: true },
  { id: 'acc-4-8001', code: '4-8001', name: 'Interest Received',               type: 'Income',      isActive: true },
  { id: 'acc-4-9000', code: '4-9000', name: 'Other Income',                    type: 'Income',      isActive: true },
  // COGS
  { id: 'acc-5-1000', code: '5-1000', name: 'COGS: Drinks',                    type: 'CostOfSales', isActive: true },
  // Expenses — Clubhouse
  { id: 'acc-6-1201', code: '6-1201', name: 'Cleaning Honorarium',             type: 'Expense',     isActive: true },
  { id: 'acc-6-1210', code: '6-1210', name: 'Rates, ESL, Waste',               type: 'Expense',     isActive: true },
  { id: 'acc-6-1211', code: '6-1211', name: 'Internet Connection',             type: 'Expense',     isActive: true },
  { id: 'acc-6-1203', code: '6-1203', name: 'Clubhouse - Electricity',          type: 'Expense',     isActive: true },
  // Expenses — Courts
  { id: 'acc-6-1301', code: '6-1301', name: 'Court Maintenance',               type: 'Expense',     isActive: true },
  // Expenses — Grounds
  { id: 'acc-6-1402', code: '6-1402', name: 'Grounds - Consumables',           type: 'Expense',     isActive: true },
  { id: 'acc-6-1403', code: '6-1403', name: 'Grounds: Repairs & Maintenance',  type: 'Expense',     isActive: true },
  // Expenses — Coaching
  { id: 'acc-6-5005', code: '6-5005', name: 'Coaching Kidsport',               type: 'Expense',     isActive: true },
  // Expenses — Other
  { id: 'acc-6-7003', code: '6-7003', name: 'Insurance',                       type: 'Expense',     isActive: true },
  { id: 'acc-6-7099', code: '6-7099', name: 'Computer Software',               type: 'Expense',     isActive: true },
  // Assets
  { id: 'acc-1-1001', code: '1-1001', name: 'Bank - Trading Account',          type: 'Asset',       isActive: true },
  { id: 'acc-1-1002', code: '1-1002', name: 'Bank - Cards Petty Cash',         type: 'Asset',       isActive: true },
  { id: 'acc-1-1003', code: '1-1003', name: 'Bank - Asset Renewal Account',    type: 'Asset',       isActive: true },
  { id: 'acc-1-1004', code: '1-1004', name: 'Bank - Asset Renewal Term Deposit', type: 'Asset',     isActive: true },
]

// ─── Bank accounts — JAN_2026 actual balances ─────────────────────────────────

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'ba-1', accountId: 'acc-1-1001', accountCode: '1-1001', name: 'Bank - Trading Account',              bankName: 'ANZ', balance: 37918.31, currency: 'AUD' },
  { id: 'ba-2', accountId: 'acc-1-1002', accountCode: '1-1002', name: 'Bank - Cards Petty Cash',             bankName: 'ANZ', balance:  1289.57, currency: 'AUD' },
  { id: 'ba-3', accountId: 'acc-1-1003', accountCode: '1-1003', name: 'Bank - Asset Renewal Account',        bankName: 'ANZ', balance: 32223.01, currency: 'AUD' },
  { id: 'ba-4', accountId: 'acc-1-1004', accountCode: '1-1004', name: 'Bank - Asset Renewal Term Deposit',   bankName: 'ANZ', balance: 63334.88, currency: 'AUD' },
]

// ─── January 2026 transactions ────────────────────────────────────────────────
// Derived from the JAN_2026 vs DEC_2025 delta.
// Total Jan income ≈ $10,464 · total Jan expenses ≈ $4,186

function line(
  id: string,
  accountId: string,
  code: string,
  name: string,
  debit: number,
  credit: number,
) {
  return { id, accountId, accountCode: code, accountName: name, debit, credit, amount: credit - debit }
}

export const MOCK_TRANSACTIONS: ReckonTransaction[] = [
  // ── Income ──
  {
    id: 'txn-j01', date: '2026-01-02', type: 'Receive',
    description: 'SQ TRANSFER SAFETY BAY TC',
    totalAmount: 557.85,
    lines: [
      line('l-j01a', 'acc-4-4011', '4-4011', 'Drink Sales',           0, 334.71),
      line('l-j01b', 'acc-4-0205', '4-0205', 'Friday Social Tennis',  0, 223.14),
    ],
  },
  {
    id: 'txn-j02', date: '2026-01-06', type: 'Receive',
    description: 'STRIPE PAYOUT SAFETY BAY TC',
    totalAmount: 576.49,
    lines: [
      line('l-j02a', 'acc-4-0500', '4-0500', 'Court Hire',            0, 576.49),
    ],
  },
  {
    id: 'txn-j03', date: '2026-01-07', type: 'Receive',
    description: 'SQ TRANSFER SAFETY BAY TC',
    totalAmount: 531.22,
    lines: [
      line('l-j03a', 'acc-4-4011', '4-4011', 'Drink Sales',           0, 318.73),
      line('l-j03b', 'acc-4-0202', '4-0202', 'Wednesday Social',      0, 212.49),
    ],
  },
  {
    id: 'txn-j04', date: '2026-01-08', type: 'Receive',
    description: 'DEPOSIT ROCKINGHAM CITY',
    totalAmount: 580.00,
    lines: [
      line('l-j04a', 'acc-4-0201', '4-0201', 'Monday Social Tennis',  0, 232.00),
      line('l-j04b', 'acc-4-0203', '4-0203', 'Thursday Social',       0, 174.00),
      line('l-j04c', 'acc-4-0207', '4-0207', 'Sunday Social Tennis',  0, 174.00),
    ],
  },
  {
    id: 'txn-j05', date: '2026-01-10', type: 'Receive',
    description: 'STRIPE PAYOUT SAFETY BAY TC',
    totalAmount: 576.49,
    lines: [
      line('l-j05a', 'acc-4-0500', '4-0500', 'Court Hire',            0, 576.49),
    ],
  },
  {
    id: 'txn-j06', date: '2026-01-12', type: 'Receive',
    description: 'MEMBERSHIP FEE SARAH HENDERSON',
    totalAmount: 165.00,
    lines: [
      line('l-j06a', 'acc-4-0101', '4-0101', 'Memberships - Adult',   0, 165.00),
    ],
  },
  {
    id: 'txn-j07', date: '2026-01-13', type: 'Receive',
    description: 'MEMBERSHIP FEE TOM NGUYEN',
    totalAmount: 165.00,
    lines: [
      line('l-j07a', 'acc-4-0101', '4-0101', 'Memberships - Adult',   0, 165.00),
    ],
  },
  {
    id: 'txn-j08', date: '2026-01-14', type: 'Receive',
    description: 'SQ TRANSFER SAFETY BAY TC',
    totalAmount: 548.96,
    lines: [
      line('l-j08a', 'acc-4-4011', '4-4011', 'Drink Sales',           0, 329.38),
      line('l-j08b', 'acc-4-0205', '4-0205', 'Friday Social Tennis',  0, 219.58),
    ],
  },
  {
    id: 'txn-j09', date: '2026-01-15', type: 'Receive',
    description: 'MEMBERSHIP FEE PRIYA SHARMA',
    totalAmount: 82.50,
    lines: [
      line('l-j09a', 'acc-4-0102', '4-0102', 'Memberships - Junior',  0, 82.50),
    ],
  },
  {
    id: 'txn-j10', date: '2026-01-20', type: 'Receive',
    description: 'ASSET RENEWAL TERM DEPOSIT INTEREST',
    totalAmount: 3994.69,
    lines: [
      line('l-j10a', 'acc-4-8001', '4-8001', 'Interest Received',     0, 3994.69),
    ],
  },
  {
    id: 'txn-j11', date: '2026-01-21', type: 'Receive',
    description: 'SQ TRANSFER SAFETY BAY TC',
    totalAmount: 475.30,
    lines: [
      line('l-j11a', 'acc-4-4011', '4-4011', 'Drink Sales',           0, 285.18),
      line('l-j11b', 'acc-4-0202', '4-0202', 'Wednesday Social',      0, 190.12),
    ],
  },
  {
    id: 'txn-j12', date: '2026-01-22', type: 'Receive',
    description: 'SHANE FOX INV 2026-001 COACHING RENT',
    totalAmount: 405.00,
    lines: [
      line('l-j12a', 'acc-4-5001', '4-5001', 'Coaching Rent Income',  0, 405.00),
    ],
  },
  {
    id: 'txn-j13', date: '2026-01-27', type: 'Receive',
    description: 'WA RETURN RECYCLE RENEW',
    totalAmount: 45.20,
    lines: [
      line('l-j13a', 'acc-4-9000', '4-9000', 'Other Income',          0, 45.20),
    ],
  },

  // ── Expenses ──
  {
    id: 'txn-j14', date: '2026-01-03', type: 'Spend',
    description: 'SYNERGY BPAY 555123 ELECTRICITY',
    totalAmount: -312.80,
    lines: [
      line('l-j14a', 'acc-6-1203', '6-1203', 'Clubhouse - Electricity', 312.80, 0),
    ],
  },
  {
    id: 'txn-j15', date: '2026-01-05', type: 'Spend',
    description: 'KAREN WENHAM CLEANING JAN 2026',
    totalAmount: -200.00,
    lines: [
      line('l-j15a', 'acc-6-1201', '6-1201', 'Cleaning Honorarium',   200.00, 0),
    ],
  },
  {
    id: 'txn-j16', date: '2026-01-08', type: 'Spend',
    description: 'PENTANET PTY LTD JAN 2026',
    totalAmount: -89.00,
    lines: [
      line('l-j16a', 'acc-6-1211', '6-1211', 'Internet Connection',    89.00, 0),
    ],
  },
  {
    id: 'txn-j17', date: '2026-01-09', type: 'Spend',
    description: 'BWS ROCKINGHAM 1234',
    totalAmount: -693.95,
    lines: [
      line('l-j17a', 'acc-5-1000', '5-1000', 'COGS: Drinks',          693.95, 0),
    ],
  },
  {
    id: 'txn-j18', date: '2026-01-14', type: 'Spend',
    description: 'JIMS MOWING 9876 GROUNDS',
    totalAmount: -440.00,
    lines: [
      line('l-j18a', 'acc-6-1403', '6-1403', 'Grounds: Repairs & Maintenance', 440.00, 0),
    ],
  },
  {
    id: 'txn-j19', date: '2026-01-15', type: 'Spend',
    description: 'RECKON LTD SOFTWARE',
    totalAmount: -55.00,
    lines: [
      line('l-j19a', 'acc-6-7099', '6-7099', 'Computer Software',      55.00, 0),
    ],
  },
  {
    id: 'txn-j20', date: '2026-01-17', type: 'Spend',
    description: 'FOX TENNIS ACADEMY INV 2026-005 KIDSPORT',
    totalAmount: -838.03,
    lines: [
      line('l-j20a', 'acc-6-5005', '6-5005', 'Coaching Kidsport',     838.03, 0),
    ],
  },
  {
    id: 'txn-j21', date: '2026-01-20', type: 'Spend',
    description: 'BUNNINGS ROCKINGHAM GROUNDS SUPPLY',
    totalAmount: -337.45,
    lines: [
      line('l-j21a', 'acc-6-1402', '6-1402', 'Grounds - Consumables', 337.45, 0),
    ],
  },
  {
    id: 'txn-j22', date: '2026-01-22', type: 'Spend',
    description: 'BARRAS MOWING SERVICE JAN',
    totalAmount: -412.55,
    lines: [
      line('l-j22a', 'acc-6-1403', '6-1403', 'Grounds: Repairs & Maintenance', 412.55, 0),
    ],
  },
  {
    id: 'txn-j23', date: '2026-01-28', type: 'Spend',
    description: 'CITY OF ROCKINGHAM BPAY RATES',
    totalAmount: -348.21,
    lines: [
      line('l-j23a', 'acc-6-1210', '6-1210', 'Rates, ESL, Waste',     348.21, 0),
    ],
  },
]

// ─── Ledger entries ───────────────────────────────────────────────────────────

export const MOCK_LEDGER_ENTRIES: LedgerEntry[] = MOCK_TRANSACTIONS.flatMap(txn =>
  txn.lines.map(line => ({
    id:              `le-${line.id}`,
    date:            txn.date,
    description:     txn.description,
    referenceNumber: txn.id,
    accountId:       line.accountId,
    accountCode:     line.accountCode,
    accountName:     line.accountName,
    debit:           line.debit,
    credit:          line.credit,
    runningBalance:  0,
  }))
)
