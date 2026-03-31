/**
 * Mock data matching the Reckon One v2 types, shaped to mirror the existing
 * static data in financialData.ts so the UI renders correctly before
 * real credentials land.
 *
 * Data is SBTC-realistic: membership fees, court hire, drinks, maintenance,
 * electricity, insurance, etc. for FY 2025-26.
 */

import type { ReckonTransaction, Account, BankAccount, LedgerEntry } from './types'

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const MOCK_ACCOUNTS: Account[] = [
  // Income
  { id: 'acc-4-0101', code: '4-0101', name: 'Memberships - Adult',         type: 'Income', isActive: true },
  { id: 'acc-4-0102', code: '4-0102', name: 'Memberships - Junior',        type: 'Income', isActive: true },
  { id: 'acc-4-0201', code: '4-0201', name: 'Monday Social Tennis',        type: 'Income', isActive: true },
  { id: 'acc-4-0202', code: '4-0202', name: 'Wednesday Social Tennis',     type: 'Income', isActive: true },
  { id: 'acc-4-0203', code: '4-0203', name: 'Thursday Social Tennis',      type: 'Income', isActive: true },
  { id: 'acc-4-0205', code: '4-0205', name: 'Friday Social Tennis',        type: 'Income', isActive: true },
  { id: 'acc-4-0301', code: '4-0301', name: 'Pennants - Men\'s',           type: 'Income', isActive: true },
  { id: 'acc-4-0401', code: '4-0401', name: 'Tournament Entry Fees',       type: 'Income', isActive: true },
  { id: 'acc-4-4011', code: '4-4011', name: 'Drink Sales',                 type: 'Income', isActive: true },
  { id: 'acc-4-5001', code: '4-5001', name: 'Coaching Rent Income',        type: 'Income', isActive: true },
  { id: 'acc-4-9000', code: '4-9000', name: 'Other Income',                type: 'Income', isActive: true },
  // COGS
  { id: 'acc-5-1000', code: '5-1000', name: 'COGS: Drinks',                type: 'CostOfSales', isActive: true },
  // Expenses
  { id: 'acc-6-1201', code: '6-1201', name: 'Cleaning Honorarium',         type: 'Expense', isActive: true },
  { id: 'acc-6-1210', code: '6-1210', name: 'Rates, ESL, Waste',           type: 'Expense', isActive: true },
  { id: 'acc-6-1211', code: '6-1211', name: 'Internet Connection',         type: 'Expense', isActive: true },
  { id: 'acc-6-1212', code: '6-1212', name: 'Electricity',                 type: 'Expense', isActive: true },
  { id: 'acc-6-1402', code: '6-1402', name: 'Grounds - Consumables',       type: 'Expense', isActive: true },
  { id: 'acc-6-1403', code: '6-1403', name: 'Grounds: Repairs & Maintenance', type: 'Expense', isActive: true },
  { id: 'acc-6-5005', code: '6-5005', name: 'Coaching Kidsport',           type: 'Expense', isActive: true },
  { id: 'acc-6-7003', code: '6-7003', name: 'Insurance',                   type: 'Expense', isActive: true },
  { id: 'acc-6-7099', code: '6-7099', name: 'Computer Software',           type: 'Expense', isActive: true },
  // Assets
  { id: 'acc-1-1001', code: '1-1001', name: 'Bank - Trading Account',      type: 'Asset', isActive: true },
  { id: 'acc-1-1002', code: '1-1002', name: 'Bank - Cards Petty Cash',     type: 'Asset', isActive: true },
  { id: 'acc-1-1003', code: '1-1003', name: 'Bank - Asset Renewal Account',type: 'Asset', isActive: true },
  { id: 'acc-1-1004', code: '1-1004', name: 'Bank - Asset Renewal Term Deposit', type: 'Asset', isActive: true },
]

// ─── Bank accounts ────────────────────────────────────────────────────────────

export const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'ba-1', accountId: 'acc-1-1001', accountCode: '1-1001', name: 'Bank - Trading Account',              bankName: 'ANZ', balance: 28453.20, currency: 'AUD' },
  { id: 'ba-2', accountId: 'acc-1-1002', accountCode: '1-1002', name: 'Bank - Cards Petty Cash',             bankName: 'ANZ', balance:  1200.00, currency: 'AUD' },
  { id: 'ba-3', accountId: 'acc-1-1003', accountCode: '1-1003', name: 'Bank - Asset Renewal Account',        bankName: 'ANZ', balance: 35000.00, currency: 'AUD' },
  { id: 'ba-4', accountId: 'acc-1-1004', accountCode: '1-1004', name: 'Bank - Asset Renewal Term Deposit',   bankName: 'ANZ', balance: 25000.00, currency: 'AUD' },
]

// ─── Transactions ─────────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: ReckonTransaction[] = [
  {
    id: 'txn-001', date: '2026-01-05', type: 'Receive',
    description: 'Memberships - January renewal batch',
    totalAmount: 3200.00,
    lines: [{ id: 'l-001', accountId: 'acc-4-0101', accountCode: '4-0101', accountName: 'Memberships - Adult', debit: 0, credit: 3200, amount: 3200 }],
  },
  {
    id: 'txn-002', date: '2026-01-07', type: 'Receive',
    description: 'Square POS — Drinks sales week 1',
    totalAmount: 485.50,
    lines: [{ id: 'l-002', accountId: 'acc-4-4011', accountCode: '4-4011', accountName: 'Drink Sales', debit: 0, credit: 485.50, amount: 485.50 }],
  },
  {
    id: 'txn-003', date: '2026-01-08', type: 'Receive',
    description: 'Wednesday Social Tennis — 6 players',
    totalAmount: 30.00,
    lines: [{ id: 'l-003', accountId: 'acc-4-0202', accountCode: '4-0202', accountName: 'Wednesday Social Tennis', debit: 0, credit: 30, amount: 30 }],
  },
  {
    id: 'txn-004', date: '2026-01-10', type: 'Spend',
    description: 'Synergy BPAY — Electricity',
    totalAmount: -312.80,
    lines: [{ id: 'l-004', accountId: 'acc-6-1212', accountCode: '6-1212', accountName: 'Electricity', debit: 312.80, credit: 0, amount: -312.80 }],
  },
  {
    id: 'txn-005', date: '2026-01-12', type: 'Spend',
    description: 'BWS — Drinks stock',
    totalAmount: -420.00,
    lines: [{ id: 'l-005', accountId: 'acc-5-1000', accountCode: '5-1000', accountName: 'COGS: Drinks', debit: 420, credit: 0, amount: -420 }],
  },
  {
    id: 'txn-006', date: '2026-01-15', type: 'Spend',
    description: 'Karen Wenham — Cleaning Jan',
    totalAmount: -200.00,
    lines: [{ id: 'l-006', accountId: 'acc-6-1201', accountCode: '6-1201', accountName: 'Cleaning Honorarium', debit: 200, credit: 0, amount: -200 }],
  },
  {
    id: 'txn-007', date: '2026-01-20', type: 'Spend',
    description: 'Elders Insurance — Annual premium',
    totalAmount: -4800.00,
    lines: [{ id: 'l-007', accountId: 'acc-6-7003', accountCode: '6-7003', accountName: 'Insurance', debit: 4800, credit: 0, amount: -4800 }],
  },
  {
    id: 'txn-008', date: '2026-01-22', type: 'Receive',
    description: 'Court hire — Stripe payout',
    totalAmount: 1260.00,
    lines: [{ id: 'l-008', accountId: 'acc-4-5001', accountCode: '4-5001', accountName: 'Coaching Rent Income', debit: 0, credit: 1260, amount: 1260 }],
  },
  {
    id: 'txn-009', date: '2026-01-25', type: 'Spend',
    description: 'Pentanet — Internet Jan',
    totalAmount: -89.00,
    lines: [{ id: 'l-009', accountId: 'acc-6-1211', accountCode: '6-1211', accountName: 'Internet Connection', debit: 89, credit: 0, amount: -89 }],
  },
  {
    id: 'txn-010', date: '2026-01-28', type: 'Spend',
    description: 'Reckon Ltd — Software subscription',
    totalAmount: -55.00,
    lines: [{ id: 'l-010', accountId: 'acc-6-7099', accountCode: '6-7099', accountName: 'Computer Software', debit: 55, credit: 0, amount: -55 }],
  },
]

// ─── Ledger entries ───────────────────────────────────────────────────────────

export const MOCK_LEDGER_ENTRIES: LedgerEntry[] = MOCK_TRANSACTIONS.flatMap(txn =>
  txn.lines.map(line => ({
    id:             `le-${line.id}`,
    date:           txn.date,
    description:    txn.description,
    referenceNumber: txn.id,
    accountId:      line.accountId,
    accountCode:    line.accountCode,
    accountName:    line.accountName,
    debit:          line.debit,
    credit:         line.credit,
    runningBalance: 0, // not computed in mock
  }))
)
