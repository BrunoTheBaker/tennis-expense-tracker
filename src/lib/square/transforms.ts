import type { Payment, Order, OrderLineItem } from './types'
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

/**
 * Map a single Order line item to a Transaction.
 * categoryName comes from the catalog cache (getCategoryName).
 * Uses base_price_money (product sales ex-surcharge) for accounting.
 */
export function squareLineItemToTransaction(
  lineItem: OrderLineItem,
  order: Order,
  categoryName?: string
): Transaction {
  const credit = lineItem.base_price_money.amount / 100
  const parts = [categoryName, lineItem.name].filter(Boolean)
  const description = parts.join(' – ')

  return {
    date:        isoToDisplayDate(order.created_at),
    description: description || 'Square item',
    debit:       0,
    credit,
    amount:      credit,
    reference:   order.id,
    status:      'pending',
    source:      'square',
    accountCode: undefined,
  }
}

/**
 * Expand all line items in an Order into Transactions.
 * Pass categoryName resolver from the catalog cache.
 */
export function orderToTransactions(
  order: Order,
  resolveCategoryName: (variationId: string | undefined) => string | undefined
): Transaction[] {
  return (order.line_items ?? [])
    .filter(li => li.item_type === 'ITEM')  // exclude custom_amount, service charges
    .map(li => squareLineItemToTransaction(li, order, resolveCategoryName(li.catalog_object_id)))
}
