'use client'

import { useState } from 'react'
import { CsvUpload } from '@/components/transactions/CsvUpload'
import { ReviewTable } from '@/components/transactions/ReviewTable'
import { ProgressBar } from '@/components/transactions/ProgressBar'
import { ExportButton } from '@/components/transactions/ExportButton'
import ReconciliationGate from '@/components/allocation/ReconciliationGate'
import ReckonPostModal from '@/components/ReckonPostModal'
import RetryQueuePanel, { RetryQueueBanner } from '@/components/RetryQueuePanel'
import type { Transaction } from '@/lib/financialData'
import type { CsvSource } from '@/lib/csvParser'
import type { PostResult } from '@/lib/reckon/write'

export default function AllocationPage() {
  const [transactions, setTransactions]     = useState<Transaction[]>([])
  const [source, setSource]                 = useState<CsvSource | null>(null)
  const [showPostModal, setShowPostModal]   = useState(false)
  const [showRetryPanel, setShowRetryPanel] = useState(false)

  function handleLoaded(txns: Transaction[], src: CsvSource) {
    setTransactions(txns)
    setSource(src)
  }

  // Called by ReckonPostModal when posting is complete
  function handlePosted(results: PostResult[], updated: Transaction[]) {
    setTransactions(updated)
    setShowPostModal(false)
    // RetryQueueBanner will re-read sessionStorage on next render
  }

  // Called by RetryQueuePanel when a retry batch completes
  function handleRetryComplete(_results: PostResult[], updatedTxns: Transaction[]) {
    setTransactions(prev => {
      const m = new Map(updatedTxns.map(t => [t.reference, t]))
      return prev.map(t => m.get(t.reference) ?? t)
    })
  }

  // Period label from the data (first transaction date's month/year)
  const period = transactions[0]?.date
    ? (() => {
        const [, m, y] = transactions[0].date.split('/')
        return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-AU', { month: 'long', year: 'numeric' })
      })()
    : undefined

  // Only confirmed, non-reckon, not already posted
  const postable = transactions.filter(
    t => t.status === 'confirmed' && t.source !== 'reckon' && !t.postedToReckon
  )

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Upload a CSV from Reckon, Square POS, or Stripe to begin allocating transactions.
        </p>
        <CsvUpload onLoaded={handleLoaded} />
      </div>
    )
  }

  const confirmed = transactions.filter(t => t.status === 'confirmed').length
  const skipped   = transactions.filter(t => t.status === 'skipped').length

  return (
    <div className="space-y-5">
      {/* Retry queue banner — shown if failed transactions exist in sessionStorage */}
      <RetryQueueBanner
        period={period}
        onView={() => setShowRetryPanel(true)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Allocation</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {transactions.length} transactions · source: <strong>{source}</strong>
          </p>
        </div>
        <div className="flex gap-3">
          {/* Standalone CSV download — always available */}
          <ExportButton transactions={transactions} />
          <button onClick={() => { setTransactions([]); setSource(null) }} className="btn-secondary text-sm">
            Upload new file
          </button>
        </div>
      </div>

      <ProgressBar confirmed={confirmed} skipped={skipped} total={transactions.length} />

      {/* Transactions table — shows "Posted" badge for postedToReckon === true */}
      <ReviewTable transactions={transactions} onChange={setTransactions} />

      {/* Reconciliation gate → opens ReckonPostModal instead of direct CSV */}
      <ReconciliationGate
        transactions={transactions}
        onConfirm={() => setShowPostModal(true)}
      />

      {/* Post to Reckon modal */}
      {showPostModal && postable.length > 0 && (
        <ReckonPostModal
          transactions={postable}
          period={period}
          onClose={() => setShowPostModal(false)}
          onPosted={handlePosted}
        />
      )}

      {/* Retry queue panel */}
      {showRetryPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-full max-w-3xl mx-4">
            <RetryQueuePanel
              period={period}
              onRetryComplete={handleRetryComplete}
              onClose={() => setShowRetryPanel(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
