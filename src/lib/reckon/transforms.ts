import type { ReckonTransaction } from './types'
import type { Transaction } from '@/lib/financialData'
import { COST_CENTRES } from '@/lib/costCentres'

/** Convert ISO 8601 date string to DD/MM/YYYY */
function isoToDisplay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

/**
 * Try to match a Reckon account name to a cost centre ledger code.
 * Reckon account names (e.g. "Clubhouse - Electricity") are compared
 * case-insensitively against COST_CENTRES labels.
 */
function resolveAccountCode(accountName: string): string | undefined {
  const lower = accountName.toLowerCase()
  return COST_CENTRES.find(cc => cc.label.toLowerCase() === lower)?.ledgerCode
}

/**
 * Maps a flat Reckon ledger transaction to the app's internal Transaction type.
 * Used by dataLoader.ts to merge Reckon data with Square data.
 */
export function reckonTransactionToTransaction(rt: ReckonTransaction): Transaction {
  const absAmount = Math.abs(rt.amount)
  const isDebit   = rt.type === 'debit'
  const desc      = rt.description || rt.memo || 'Reckon transaction'

  return {
    date:        isoToDisplay(rt.transactionDate),
    description: desc,
    debit:       isDebit ? absAmount : 0,
    credit:      isDebit ? 0 : absAmount,
    amount:      isDebit ? -absAmount : absAmount,
    reference:   rt.reference ?? rt.id,
    status:      'confirmed',
    source:      'reckon',
    accountCode: resolveAccountCode(rt.accountName),
  }
}
