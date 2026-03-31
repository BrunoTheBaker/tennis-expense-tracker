import { describe, it, expect } from 'vitest'
import { parseReckonCsv, getMerchantKey, detectCsvSource, parseSquareCsv, parseStripeCsv } from '@/lib/csvParser'

const SAMPLE_CSV = `Date,Description,Debit,Credit,Balance,Reference
08/01/2026,BUNNINGS ROCKINGHAM,337.45,,12000.00,REF001
12/01/2026,TENNIS WA AFFILIATION,4029.30,,7970.70,REF002
15/01/2026,SQUARE *COURT HIRE,,125.00,8095.70,REF003
,,,,,
Total,,,,,
`

describe('parseReckonCsv', () => {
  it('parses 3 data rows and skips blanks and total', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows).toHaveLength(3)
  })

  it('correctly derives signed amount from debit/credit', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows[0].amount).toBeCloseTo(-337.45) // debit = negative
    expect(rows[2].amount).toBeCloseTo(125.00)  // credit = positive
  })

  it('parses date in DD/MM/YYYY format', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows[0].date).toBe('08/01/2026')
  })

  it('sets status to pending for all rows', () => {
    const rows = parseReckonCsv(SAMPLE_CSV)
    expect(rows.every(r => r.status === 'pending')).toBe(true)
  })
})

describe('getMerchantKey', () => {
  it('normalises description to first two tokens', () => {
    expect(getMerchantKey('BUNNINGS ROCKINGHAM')).toBe('BUNNINGS ROCKINGHAM')
  })

  it('strips content after asterisk', () => {
    expect(getMerchantKey('SQUARE *COURT HIRE')).toBe('SQUARE COURT')
  })

  it('handles single-word descriptions', () => {
    expect(getMerchantKey('WOOLWORTHS')).toBe('WOOLWORTHS')
  })
})

describe('detectCsvSource', () => {
  it('detects Reckon by Debit/Credit headers', () => {
    const csv = 'Date,Description,Reference,Debit,Credit,Balance\n'
    expect(detectCsvSource(csv)).toBe('reckon')
  })

  it('detects Square by Category/Net Sales headers', () => {
    const csv = 'Date,Time,Time Zone,Category,Item,Qty,Price Point Name,SKU,Modifiers Applied,Gross Sales,Discounts,Net Sales,Tax,Transaction ID\n'
    expect(detectCsvSource(csv)).toBe('square')
  })

  it('detects Stripe by Created (UTC)/Seller Message headers', () => {
    const csv = 'id,Description,Seller Message,Created (UTC),Amount,Amount Refunded,Currency,Status\n'
    expect(detectCsvSource(csv)).toBe('stripe')
  })

  it('returns unknown for unrecognised format', () => {
    const csv = 'foo,bar,baz\n'
    expect(detectCsvSource(csv)).toBe('unknown')
  })
})

describe('parseSquareCsv', () => {
  const squareCsv = `Date,Time,Time Zone,Category,Item,Qty,Price Point Name,SKU,Modifiers Applied,Gross Sales,Discounts,Net Sales,Tax,Transaction ID
2025-12-01,09:00,AWST,Drinks,Beer,1,Pint,,, $5.50,$0.00,$5.50,$0.00,ABC123
2025-12-01,09:05,AWST,Social Tennis,Friday Social,1,Day Fee,,, $5.00,$0.00,$5.00,$0.00,ABC124
`

  it('parses rows into transactions', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns).toHaveLength(2)
  })

  it('maps date from YYYY-MM-DD to DD/MM/YYYY', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].date).toBe('01/12/2025')
  })

  it('sets positive amount from Net Sales', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].amount).toBeCloseTo(5.50)
  })

  it('sets source to square', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].source).toBe('square')
  })

  it('sets description to Category — Item', () => {
    const txns = parseSquareCsv(squareCsv)
    expect(txns[0].description).toBe('Drinks — Beer')
  })
})

describe('parseStripeCsv', () => {
  const stripeCsv = `id,Description,Seller Message,Created (UTC),Amount,Amount Refunded,Currency,Status
py_abc,Court Hire — Booking #1234,Payment complete,2025-12-05 14:30,45.00,0.00,AUD,Paid
py_xyz,Membership — Adult,Payment complete,2025-12-06 09:15,180.00,0.00,AUD,Paid
`

  it('parses rows into transactions', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns).toHaveLength(2)
  })

  it('maps Created (UTC) date to DD/MM/YYYY', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns[0].date).toBe('05/12/2025')
  })

  it('sets positive amount', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns[0].amount).toBeCloseTo(45.00)
  })

  it('sets source to stripe', () => {
    const txns = parseStripeCsv(stripeCsv)
    expect(txns[0].source).toBe('stripe')
  })

  it('skips non-Paid rows', () => {
    const csv = `id,Description,Seller Message,Created (UTC),Amount,Amount Refunded,Currency,Status
py_fail,Test,fail,2025-12-05 10:00,10.00,0.00,AUD,Failed
`
    expect(parseStripeCsv(csv)).toHaveLength(0)
  })
})
