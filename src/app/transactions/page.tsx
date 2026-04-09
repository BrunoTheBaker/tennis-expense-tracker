'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CsvUpload } from '@/components/transactions/CsvUpload'
import { ReviewTable } from '@/components/transactions/ReviewTable'
import { ProgressBar } from '@/components/transactions/ProgressBar'
import { ExportButton } from '@/components/transactions/ExportButton'
import ReconciliationGate from '@/components/allocation/ReconciliationGate'
import type { Transaction } from '@/lib/financialData'
import { PERIOD_LABELS } from '@/lib/financialData'
import { serialiseToReckonCsv } from '@/lib/csvParser'
import { getCachedPeriod, getActivePeriodKey } from '@/lib/dataCache'

type DataSource = 'live' | 'csv'

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return 'just now'
  const mins = Math.floor(ms / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function AllocationPage() {
  const router = useRouter()
  const [transactions,  setTransactions]  = useState<Transaction[]>([])
  const [dataSource,    setDataSource]    = useState<DataSource | null>(null)
  const [activePeriod,  setActivePeriod]  = useState<string | null>(null)
  const [cacheLoadedAt, setCacheLoadedAt] = useState<string | null>(null)
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [csvToast,      setCsvToast]      = useState<string | null>(null)

  // On mount: read from cache for the active period
  useEffect(() => {
    const key = getActivePeriodKey()
    if (!key) return
    const cached = getCachedPeriod(key)
    if (cached?.transactions?.length) {
      setTransactions(cached.transactions)
      setDataSource('live')
      setActivePeriod(key)
      setCacheLoadedAt(cached.loadedAt)
    }
  }, [])

  function handleRefresh() {
    const key = getActivePeriodKey()
    if (!key) return
    const cached = getCachedPeriod(key)
    if (cached?.transactions?.length) {
      setTransactions(cached.transactions)
      setCacheLoadedAt(cached.loadedAt)
    }
  }

  function handleCsvLoaded(csvTxns: Transaction[], _src: 'reckon' | 'square' | 'stripe') {
    if (dataSource === 'live' && transactions.length > 0) {
      // Merge: deduplicate by reference — live data takes precedence
      const existingRefs = new Set(transactions.map(t => t.reference))
      const newTxns = csvTxns.filter(t => !existingRefs.has(t.reference))
      const liveBefore = transactions.length
      setTransactions(prev => [...prev, ...newTxns])
      setShowCsvUpload(false)
      setCsvToast(`${newTxns.length} CSV transactions added alongside ${liveBefore} live transactions`)
      setTimeout(() => setCsvToast(null), 4000)
    } else {
      setTransactions(csvTxns)
      setDataSource('csv')
    }
  }

  function handleExport() {
    const csv = serialiseToReckonCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `sbtc-reconciled-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── State B: no data loaded ──────────────────────────────────────────────────
  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
        <div className="card text-center py-10 space-y-4">
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            No data loaded for this period yet.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Go to Dashboard and select a period to load transactions automatically.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go to Dashboard →
          </button>

          <div className="flex items-center gap-3 justify-center pt-2">
            <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>or</span>
            <hr className="flex-1" style={{ borderColor: 'var(--border)' }} />
          </div>

          <div className="flex justify-center">
            <CsvUpload onLoaded={handleCsvLoaded} />
          </div>
        </div>
      </div>
    )
  }

  // ── State A / C: data loaded ─────────────────────────────────────────────────
  const confirmed    = transactions.filter(t => t.status === 'confirmed').length
  const skipped      = transactions.filter(t => t.status === 'skipped').length
  const squareCount  = transactions.filter(t => t.source === 'square').length
  const reckonCount  = transactions.filter(t => t.source === 'reckon').length
  const periodLabel  = (activePeriod && PERIOD_LABELS[activePeriod]) ?? activePeriod ?? ''

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
          {dataSource === 'live' && cacheLoadedAt ? (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              {transactions.length} transactions
              {squareCount > 0 && ` · Square ${squareCount}`}
              {reckonCount > 0 && ` · Reckon ${reckonCount}`}
              {periodLabel && ` · ${periodLabel}`}
              {' · '}loaded {timeAgo(cacheLoadedAt)}
              {' '}
              <button onClick={handleRefresh} title="Re-read from cache" className="hover:opacity-70">↻</button>
            </p>
          ) : (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
              {transactions.length} transactions
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <ExportButton transactions={transactions} />
          {dataSource === 'live' && (
            <button
              onClick={() => setShowCsvUpload(v => !v)}
              className="btn-secondary text-sm"
            >
              {showCsvUpload ? 'Hide CSV upload' : 'Upload CSV'}
            </button>
          )}
          <button
            onClick={() => { setTransactions([]); setDataSource(null); setShowCsvUpload(false) }}
            className="btn-secondary text-sm"
          >
            {dataSource === 'live' ? 'Clear' : 'Upload new file'}
          </button>
        </div>
      </div>

      {/* CSV merge toast */}
      {csvToast && (
        <div className="rounded-lg px-4 py-2 text-sm" style={{ background: 'rgba(29,158,117,0.1)', color: 'var(--brand)' }}>
          {csvToast}
        </div>
      )}

      {/* Inline CSV upload (State A only, toggled) */}
      {showCsvUpload && dataSource === 'live' && (
        <div className="card py-4">
          <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>
            CSV transactions will be merged with existing live data. Duplicates (by reference) are skipped.
          </p>
          <CsvUpload onLoaded={handleCsvLoaded} />
        </div>
      )}

      <ProgressBar confirmed={confirmed} skipped={skipped} total={transactions.length} />
      <ReviewTable transactions={transactions} onChange={setTransactions} />
      <ReconciliationGate transactions={transactions} onConfirm={handleExport} />
    </div>
  )
}
