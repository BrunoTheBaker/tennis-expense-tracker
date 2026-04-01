import type { Transaction } from '@/lib/financialData'

/** Groups transactions by their orderId. Transactions without orderId are omitted. */
export function groupByOrder(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    if (!tx.orderId) continue
    const group = map.get(tx.orderId)
    if (group) {
      group.push(tx)
    } else {
      map.set(tx.orderId, [tx])
    }
  }
  return map
}

/**
 * Returns all transactions that share the same orderId as the given transaction,
 * excluding the transaction itself.
 */
export function getOrderSiblings(
  transaction: Transaction,
  allTransactions: Transaction[]
): Transaction[] {
  if (!transaction.orderId) return []
  return allTransactions.filter(
    t => t !== transaction && t.orderId === transaction.orderId
  )
}

/**
 * Calculates the total amount across all transactions with the same orderId
 * (including the transaction itself).
 */
export function getOrderTotal(
  transaction: Transaction,
  allTransactions: Transaction[]
): number {
  if (!transaction.orderId) return transaction.amount
  return allTransactions
    .filter(t => t.orderId === transaction.orderId)
    .reduce((sum, t) => sum + t.amount, 0)
}
