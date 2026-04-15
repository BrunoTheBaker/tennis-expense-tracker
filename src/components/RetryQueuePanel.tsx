'use client'

import { useState, useEffect } from 'react'
import type { Transaction } from '@/lib/financialData'
import type { PostResult } from '@/lib/reckon/write'
import CostCentrePicker from '@/components/allocation/CostCentrePicker'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  period?: string
  onRetryComplete: (results: PostResult[], updatedTransactions: Transaction[]) => void
  onClose: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n)
}

function loadQueue(period: string): Transaction[] {
  try {
    const raw = sessionStorage.getItem(`sbtc_retry_queue_${period}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveQueue(period: string, transactions: Transaction[]) {
  try {
    if (transactions.length === 0) {
      sessionStorage.removeItem(`sbtc_retry_queue_${period}`)
    } else {
      sessionStorage.setItem(`sbtc_retry_queue_${period}`, JSON.stringify(transactions))
    }
  } catch { /* ignore */ }
}

async function postOne(transaction: Transaction): Promise<PostResult> {
  try {
    const res  = await fetch('/api/reckon/post-transactions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ transactions: [transaction] }),
    })
    const data = await res.json()
    return data.results?.[0] ?? { transactionId: transaction.reference, status: 'failed', error: `HTTP ${res.status}` }
  } catch (err) {
    return { transactionId: transaction.reference, status: 'failed', error: err instanceof Error ? err.message : 'Network error' }
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RetryQueuePanel({ period = 'current', onRetryComplete, onClose }: Props) {
  const [queue, setQueue]         = useState<Transaction[]>([])
  const [retrying, setRetrying]   = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setQueue(loadQueue(period))
  }, [period])

  // ── Update cost centre inline ──────────────────────────────────────────────
  function handleCostCentreChange(txnRef: string, code: string) {
    setQueue(prev => {
      const updated = prev.map(t =>
        t.reference === txnRef ? { ...t, accountCode: code, postError: undefined } : t
      )
      saveQueue(period, updated)
      return updated
    })
    setEditingId(null)
  }

  // ── Retry single ──────────────────────────────────────────────────────────
  async function handleRetryOne(txn: Transaction) {
    setRetrying(prev => new Set(prev).add(txn.reference))
    const result = await postOne({ ...txn, postedToReckon: false, postError: undefined })
    setRetrying(prev => { const s = new Set(prev); s.delete(txn.reference); return s })

    if (result.status === 'success') {
      const remaining = queue.filter(t => t.reference !== txn.reference)
      setQueue(remaining)
      saveQueue(period, remaining)
      const updated = [{ ...txn, postedToReckon: true as const, reckonId: result.reckonId }]
      onRetryComplete([result], updated)
    } else {
      setQueue(prev => prev.map(t =>
        t.reference === txn.reference ? { ...t, postError: result.error } : t
      ))
    }
  }

  // ── Retry all ─────────────────────────────────────────────────────────────
  async function handleRetryAll() {
    const allResults: PostResult[] = []
    const updatedTransactions: Transaction[] = []

    for (const txn of queue) {
      setRetrying(prev => new Set(prev).add(txn.reference))
      const result = await postOne({ ...txn, postedToReckon: false, postError: undefined })
      setRetrying(prev => { const s = new Set(prev); s.delete(txn.reference); return s })
      allResults.push(result)
      if (result.status === 'success') {
        updatedTransactions.push({ ...txn, postedToReckon: true, reckonId: result.reckonId })
      }
    }

    const stillFailed = queue.filter((_, i) => allResults[i].status !== 'success')
    setQueue(stillFailed)
    saveQueue(period, stillFailed)
    onRetryComplete(allResults, updatedTransactions)
  }

  if (queue.length === 0) {
    return (
      <div className="card">
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>No transactions in the retry queue.</p>
        <button className="btn-secondary text-sm mt-3" onClick={onClose}>Close</button>
      </div>
    )
  }

  const isAnyRetrying = retrying.size > 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>
            Retry Queue
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {queue.length} failed transaction{queue.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-primary text-sm"
            onClick={handleRetryAll}
            disabled={isAnyRetrying}
          >
            {isAnyRetrying ? 'Retrying…' : 'Retry all'}
          </button>
          <button className="btn-secondary text-sm" onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
              {['Description', 'Amount', 'Cost Centre', 'Error', ''].map(h => (
                <th key={h} className="text-left py-2 pr-3 font-medium" style={{ color: 'var(--text-3)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queue.map(txn => {
              const isRetrying = retrying.has(txn.reference)
              const isEditing  = editingId === txn.reference
              return (
                <tr key={txn.reference} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5 pr-3 max-w-[180px]">
                    <span className="truncate block" style={{ color: 'var(--text-1)' }}>{txn.description}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{txn.date}</span>
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums font-mono whitespace-nowrap" style={{ color: txn.amount >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {fmt(Math.abs(txn.amount))}
                  </td>
                  <td className="py-2.5 pr-3">
                    {isEditing ? (
                      <CostCentrePicker
                        transaction={txn}
                        currentCode={txn.accountCode}
                        onSelect={(code) => handleCostCentreChange(txn.reference, code)}
                      />
                    ) : (
                      <span
                        className="text-xs cursor-pointer hover:underline"
                        style={{ color: txn.accountCode ? 'var(--text-2)' : 'var(--red)' }}
                        onClick={() => setEditingId(txn.reference)}
                      >
                        {txn.accountCode ?? '⚠ unassigned'}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 max-w-[200px]">
                    <span className="text-xs line-clamp-2" style={{ color: 'var(--red)' }}>
                      {txn.postError ?? '—'}
                    </span>
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button
                        className="btn-secondary text-xs py-1 px-2"
                        onClick={() => handleRetryOne(txn)}
                        disabled={isRetrying || isAnyRetrying}
                      >
                        {isRetrying ? '…' : 'Retry'}
                      </button>
                      <button
                        className="btn-secondary text-xs py-1 px-2"
                        onClick={() => setEditingId(isEditing ? null : txn.reference)}
                        disabled={isRetrying || isAnyRetrying}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Retry queue banner (shown on allocation page if queue exists) ─────────────

interface BannerProps {
  period?: string
  onView: () => void
}

export function RetryQueueBanner({ period = 'current', onView }: BannerProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const q = loadQueue(period)
    setCount(q.length)
  }, [period])

  if (count === 0) return null

  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
      style={{ background: 'rgba(185,28,28,0.07)', border: '1.5px solid rgba(185,28,28,0.2)' }}
    >
      <span style={{ color: 'var(--red)' }}>
        ⚠ {count} transaction{count !== 1 ? 's' : ''} failed to post
      </span>
      <button className="btn-secondary text-xs" onClick={onView}>
        View &amp; retry →
      </button>
    </div>
  )
}
