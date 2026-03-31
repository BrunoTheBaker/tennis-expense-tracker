/**
 * TypeScript interfaces for Reckon One API v2 response shapes.
 * Based on the Reckon One v2 Swagger spec at https://api-v2.reckonone.com/swagger/index.html
 *
 * // TODO: RECKON API — verify field names against live Swagger once credentials arrive.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export interface ReckonApiError {
  statusCode: number
  message: string
  details?: string
}

export interface PagedResponse<T> {
  data: T[]
  totalCount: number
  pageSize: number
  pageNumber: number
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export type AccountType =
  | 'Asset'
  | 'Liability'
  | 'Equity'
  | 'Income'
  | 'Expense'
  | 'CostOfSales'

export interface Account {
  id: string
  code: string          // e.g. "4-0201"
  name: string          // e.g. "Monday Social Tennis"
  type: AccountType
  isActive: boolean
  description?: string
}

// ─── Bank accounts ────────────────────────────────────────────────────────────

export interface BankAccount {
  id: string
  accountId: string     // links to Account.id
  accountCode: string   // e.g. "1-1001"
  name: string          // e.g. "Bank - Trading Account"
  bankName?: string
  bsb?: string
  accountNumber?: string
  balance: number
  currency: string      // "AUD"
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType =
  | 'Spend'
  | 'Receive'
  | 'Transfer'
  | 'Journal'

export interface ReckonTransaction {
  id: string
  date: string          // ISO 8601, e.g. "2026-01-15"
  type: TransactionType
  referenceNumber?: string
  description: string
  totalAmount: number   // positive for income, negative for expense
  lines: TransactionLine[]
}

export interface TransactionLine {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  description?: string
  debit: number
  credit: number
  amount: number        // credit - debit
}

// ─── Ledger entries ───────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string
  date: string          // ISO 8601
  description: string
  referenceNumber?: string
  accountId: string
  accountCode: string   // e.g. "6-1402"
  accountName: string
  debit: number
  credit: number
  runningBalance: number
}
