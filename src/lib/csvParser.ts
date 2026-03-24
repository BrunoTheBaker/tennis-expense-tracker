import type { Transaction } from './financialData'

/**
 * Derives a stable merchant key from a raw Reckon transaction description.
 * Used as the localStorage cache key for merchant→account mappings.
 * Rule: uppercase, split on '*', take first segment, then take first two space-separated tokens.
 */
export function getMerchantKey(description: string): string {
  // Remove asterisk and join remaining parts, then take first two tokens
  const normalised = description.toUpperCase().replace(/\s*\*\s*/g, ' ').trim()
  const tokens = normalised.split(/\s+/).filter(Boolean)
  return tokens.slice(0, 2).join(' ')
}

/**
 * Parses a Reckon CSV export (Transactions by Account report).
 * Handles: header row, blank rows, "Total" footer row, separate Debit/Credit columns.
 * Date format: DD/MM/YYYY
 */
export function parseReckonCsv(csvText: string): Transaction[] {
  const lines = csvText.split(/\r?\n/)
  const transactions: Transaction[] = []

  for (const line of lines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))

    // Skip header row
    if (cols[0].toLowerCase() === 'date') continue

    // Skip blank rows
    if (!cols[0]) continue

    // Skip total/summary rows
    if (cols[0].toLowerCase().startsWith('total')) continue

    // Must look like a date DD/MM/YYYY
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(cols[0])) continue

    const date        = cols[0]
    const description = cols[1] || ''
    const debit       = parseFloat(cols[2]) || 0
    const credit      = parseFloat(cols[3]) || 0
    const reference   = cols[5] || ''

    transactions.push({
      date,
      description,
      debit,
      credit,
      amount: credit - debit, // positive = income, negative = expense
      reference,
      status: 'pending',
    })
  }

  return transactions
}

/**
 * Serialises transactions back to CSV for Reckon reimport.
 * Appends AccountCode column. Skipped rows have empty AccountCode.
 * Output: UTF-8 with BOM, DD/MM/YYYY dates preserved.
 */
export function serialiseToReckonCsv(transactions: Transaction[]): string {
  const BOM = '\uFEFF'
  const header = 'Date,Description,Debit,Credit,Balance,Reference,AccountCode'

  const rows = transactions.map(t => {
    const code = t.status === 'confirmed' ? (t.accountCode ?? '') : ''
    return [t.date, t.description, t.debit || '', t.credit || '', '', t.reference, code]
      .map(v => (String(v).includes(',') ? `"${v}"` : v))
      .join(',')
  })

  return BOM + [header, ...rows].join('\r\n')
}
