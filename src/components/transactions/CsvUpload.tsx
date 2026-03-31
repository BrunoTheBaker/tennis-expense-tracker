'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import type { Transaction } from '@/lib/financialData'
import { parseReckonCsv, parseSquareCsv, parseStripeCsv, detectCsvSource } from '@/lib/csvParser'

interface Props {
  onLoaded: (transactions: Transaction[], source: 'reckon' | 'square' | 'stripe') => void
}

const SOURCE_LABEL: Record<string, string> = {
  reckon: 'Reckon bank export',
  square: 'Square POS export',
  stripe: 'Stripe payments export',
}

const SOURCE_HINT: Record<string, string> = {
  reckon: 'Reckon → Reports → Transaction Reports → All Transactions → Export CSV',
  square: 'Square → Reports → Item Sales → Export CSV',
  stripe: 'Stripe → Payments → Export → CSV',
}

export function CsvUpload({ onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const source = detectCsvSource(text)

      if (source === 'unknown') {
        alert('Unrecognised CSV format. Expected a Reckon, Square, or Stripe export.')
        return
      }

      const parsers = { reckon: parseReckonCsv, square: parseSquareCsv, stripe: parseStripeCsv }
      const transactions = parsers[source](text)
      onLoaded(transactions, source)
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div
      className="card text-center cursor-pointer transition-colors"
      style={{ border: '2px dashed var(--border)' }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <Upload className="mx-auto mb-3" size={36} style={{ color: 'var(--text-3)' }} />
      <p className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>
        Upload CSV
      </p>
      <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>
        Accepts: Reckon bank export · Square POS · Stripe payments
      </p>
      <div className="flex justify-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
        {Object.entries(SOURCE_HINT).map(([src, hint]) => (
          <span key={src}>
            <strong>{SOURCE_LABEL[src]}:</strong> {hint}
          </span>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>Drag and drop or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
