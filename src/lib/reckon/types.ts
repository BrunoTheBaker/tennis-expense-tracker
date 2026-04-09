/**
 * TypeScript interfaces for Reckon One API v2 response shapes.
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

/** Raw account from Reckon chart of accounts endpoint. */
export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  isActive: boolean
  description?: string
}

/** Spec-aligned account type (used by api.ts getAccounts). */
export interface ReckonAccount {
  id: string
  name: string
  code: string
  type: string
  balance: number
}

// ─── Bank accounts ────────────────────────────────────────────────────────────

/** Raw bank account from Reckon bank accounts endpoint. */
export interface BankAccount {
  id: string
  accountId: string
  accountCode: string
  name: string
  bankName?: string
  bsb?: string
  accountNumber?: string
  balance: number
  currency: string
}

/** Spec-aligned bank balance type (used by api.ts getBankBalances). */
export interface ReckonBankBalance {
  id: string
  name: string
  balance: number
  currency: string
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionType =
  | 'Spend'
  | 'Receive'
  | 'Transfer'
  | 'Journal'

export interface TransactionLine {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  description?: string
  debit: number
  credit: number
  amount: number
}

/**
 * Raw journal transaction from the Reckon API (has nested line items).
 * Used by the mock data and the generic proxy route.
 */
export interface ReckonJournalEntry {
  id: string
  date: string
  type: TransactionType
  referenceNumber?: string
  description: string
  totalAmount: number
  lines: TransactionLine[]
}

/**
 * Flat ledger transaction — one line item per entry.
 * This is the spec-defined shape returned by getLedgerTransactions()
 * and the input type for reckonTransactionToTransaction().
 */
export interface ReckonTransaction {
  id: string
  transactionDate: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  accountId: string
  accountName: string
  contactName?: string
  reference?: string
  memo?: string
}

// ─── Ledger entries ───────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string
  date: string
  description: string
  referenceNumber?: string
  accountId: string
  accountCode: string
  accountName: string
  debit: number
  credit: number
  runningBalance: number
}

// ─── P&L report ───────────────────────────────────────────────────────────────

export interface ReckonPnL {
  income:    { accountName: string; amount: number }[]
  expenses:  { accountName: string; amount: number }[]
  netProfit: number
}
