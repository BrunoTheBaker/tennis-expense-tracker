'use client'

import { useState, useEffect } from 'react'
import { CsvUpload } from '@/components/transactions/CsvUpload'
import { ReviewTable } from '@/components/transactions/ReviewTable'
import { ProgressBar } from '@/components/transactions/ProgressBar'
import { ExportButton } from '@/components/transactions/ExportButton'
import ReconciliationGate from '@/components/allocation/ReconciliationGate'
import type { Transaction } from '@/lib/financialData'
import type { CsvSource } from '@/lib/csvParser'
import { serialiseToReckonCsv } from '@/lib/csvParser'
import { getCachedPeriod, getActivePeriodKey, clearCachedPeriod } from '@/lib/dataCache'
import { PERIOD_LABELS } from '@/lib/financialData'

export default function AllocationPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [source, setSource] = useState<CsvSource | null>(null)
  const [cacheLabel, setCacheLabel] = useState<string | null>(null)

  // On mount, hydrate from cache if available
  useEffect(() => {
    const periodKey = getActivePeriodKey()
    if (!periodKey) return
    const cached = getCachedPeriod(periodKey)
    if (cached && cached.transactions.length > 0) {
      setTransactions(cached.transactions)
      // TODO: derive from cached.sources when Reckon/Stripe cache writing is implemented
      setSource('square')
      setCacheLabel(PERIOD_LABELS[periodKey] ?? periodKey)
    }
  }, [])

  function handleLoaded(txns: Transaction[], src: CsvSource) {
    setTransactions(txns)
    setSource(src)
    setCacheLabel(null)
  }

  function handleReset() {
    // Clear cache for active period so reload doesn't re-hydrate old data
    const activePeriod = getActivePeriodKey()
    if (activePeriod) clearCachedPeriod(activePeriod)
    setTransactions([])
    setSource(null)
    setCacheLabel(null)
  }

  function handleExport() {
    const csv = serialiseToReckonCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sbtc-reconciled-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Select a period on the Dashboard to load Square transactions, or upload a CSV from Reckon, Square POS, or Stripe below.
        </p>
        <CsvUpload onLoaded={handleLoaded} />
      </div>
    )
  }

  const confirmed = transactions.filter(t => t.status === 'confirmed').length
  const skipped   = transactions.filter(t => t.status === 'skipped').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {transactions.length} transactions · source: <strong>{source}</strong>
            {cacheLabel && (
              <span> · period: <strong>{cacheLabel}</strong></span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButton transactions={transactions} />
          <button type="button" onClick={handleReset} className="btn-secondary text-sm">
            Upload new file
          </button>
        </div>
      </div>

      <ProgressBar confirmed={confirmed} skipped={skipped} total={transactions.length} />
      <ReviewTable transactions={transactions} onChange={setTransactions} />
      <ReconciliationGate transactions={transactions} onConfirm={handleExport} />
    </div>
  )
}
