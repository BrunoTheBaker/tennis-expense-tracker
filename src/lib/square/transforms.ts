import type { Payment } from './types'
import type { Transaction } from '@/lib/financialData'

/** Convert a Square ISO 8601 timestamp to DD/MM/YYYY */
function isoToDisplayDate(iso: string): string {
  const d = new Date(iso)
  const dd   = String(d.getUTCDate()).padStart(2, '0')
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/** Map a Square Payment to the internal Transaction shape for allocation review. */
export function squarePaymentToTransaction(payment: Payment): Transaction {
  const credit = payment.amount_money.amount / 100

  return {
    date:        isoToDisplayDate(payment.created_at),
    description: payment.note ?? 'Square payment',
    debit:       0,
    credit,
    amount:      credit,
    reference:   payment.id,
    status:      'pending',
    source:      'square',
    accountCode: undefined,
  }
}
