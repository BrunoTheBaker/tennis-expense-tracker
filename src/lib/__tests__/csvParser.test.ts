import { describe, it, expect } from 'vitest'
import { parseReckonCsv, getMerchantKey } from '@/lib/csvParser'

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
