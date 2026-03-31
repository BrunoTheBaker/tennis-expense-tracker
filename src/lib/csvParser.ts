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
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/)
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
      source: 'reckon' as const,
    })
  }

  return transactions
}

// ─── CSV source detection ─────────────────────────────────────────────────────

export type CsvSource = 'reckon' | 'square' | 'stripe' | 'unknown'

export function detectCsvSource(csvText: string): CsvSource {
  const header = csvText.split('\n')[0].toLowerCase()
  if (header.includes('debit') && header.includes('credit')) return 'reckon'
  if (header.includes('net sales') && header.includes('category')) return 'square'
  if (header.includes('created (utc)') && header.includes('seller message')) return 'stripe'
  return 'unknown'
}

// ─── Square POS parser ────────────────────────────────────────────────────────

export function parseSquareCsv(csvText: string): Transaction[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  const iDate     = idx('date')
  const iCat      = idx('category')
  const iItem     = idx('item')
  const iNetSales = idx('net sales')
  const iTxnId    = idx('transaction id')

  return lines.slice(1).flatMap(line => {
    const cols = splitCsvLine(line)
    if (cols.length < 4) return []

    const netSalesRaw = (cols[iNetSales] ?? '').replace(/[$,\s]/g, '')
    const netSales = parseFloat(netSalesRaw)
    if (isNaN(netSales) || netSales === 0) return []

    const rawDate = (cols[iDate] ?? '').trim()
    const [y, m, d] = rawDate.split('-')
    const date = `${d}/${m}/${y}`

    const category    = (cols[iCat] ?? '').trim()
    const item        = (cols[iItem] ?? '').trim()
    const description = `${category} — ${item}`
    const reference   = (cols[iTxnId] ?? '').trim()

    return [{
      date,
      description,
      debit: 0,
      credit: netSales,
      amount: netSales,
      reference,
      status: 'pending' as const,
      source: 'square' as const,
    }]
  })
}

// ─── Stripe parser ────────────────────────────────────────────────────────────

export function parseStripeCsv(csvText: string): Transaction[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  const iId     = idx('id')
  const iDesc   = idx('description')
  const iDate   = idx('created (utc)')
  const iAmount = idx('amount')
  const iStatus = idx('status')

  return lines.slice(1).flatMap(line => {
    const cols = splitCsvLine(line)
    if (cols.length < 4) return []

    const status = (cols[iStatus] ?? '').trim()
    if (status.toLowerCase() !== 'paid') return []

    const amountRaw = (cols[iAmount] ?? '').replace(/[$,\s]/g, '')
    const amount = parseFloat(amountRaw)
    if (isNaN(amount)) return []

    const rawDate = (cols[iDate] ?? '').trim().split(' ')[0]
    const [y, m, d] = rawDate.split('-')
    const date = `${d}/${m}/${y}`

    const description = (cols[iDesc] ?? '').trim()
    const reference   = (cols[iId] ?? '').trim()

    return [{
      date,
      description,
      debit: 0,
      credit: amount,
      amount,
      reference,
      status: 'pending' as const,
      source: 'stripe' as const,
    }]
  })
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
    current += ch
  }
  result.push(current.trim())
  return result
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
