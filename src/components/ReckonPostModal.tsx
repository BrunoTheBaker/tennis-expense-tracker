'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Transaction } from '@/lib/financialData'
import type { PostResult } from '@/lib/reckon/write'
import type { PostSummary } from '@/app/api/reckon/post-transactions/route'
import type { AuthErrorCode } from '@/lib/reckon/ReckonAuthError'
import { serialiseToReckonCsv } from '@/lib/csvParser'
import ReckonReauthModal from '@/components/ReckonReauthModal'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'summary' | 'posting' | 'results'

interface PausedState {
  authErrorCode:    AuthErrorCode
  completedResults: PostResult[]
  remaining:        Transaction[]
}

interface Props {
  transactions: Transaction[]   // must already be filtered to confirmed, non-skipped
  period?: string               // e.g. "March 2025" — shown in the summary
  unallocatedCount?: number     // transactions not yet allocated (shown as info only)
  onClose: () => void
  onPosted: (results: PostResult[], updatedTransactions: Transaction[]) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n)
}

function downloadCsvBackup(transactions: Transaction[]) {
  const csv  = serialiseToReckonCsv(transactions)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `sbtc-allocated-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReckonPostModal({ transactions, period, unallocatedCount, onClose, onPosted }: Props) {
  const [screen, setScreen]     = useState<Screen>('summary')
  const [results, setResults]   = useState<PostResult[]>([])
  const [summary, setSummary]   = useState<PostSummary | null>(null)
  const [liveFeed, setLiveFeed] = useState<PostResult[]>([])   // last 3 completed
  const [current, setCurrent]   = useState<string>('')          // description being posted
  const [progress, setProgress] = useState(0)                   // 0–total posted so far
  const [paused, setPaused]     = useState<PausedState | null>(null)
  const postingRef              = useRef(false)

  // ── Summary stats ──────────────────────────────────────────────────────────
  const postable    = transactions.filter(t => t.source !== 'reckon' && !t.postedToReckon)
  const grandTotal  = postable.reduce((s, t) => s + Math.abs(t.amount), 0)
  const bySource    = groupBy(postable, t => t.source ?? 'unknown')
  const byCostCentre = groupBy(postable, t => t.accountCode ?? 'unassigned')
  const ccEntries   = Object.entries(byCostCentre)
    .map(([code, txns]) => ({
      code,
      total: txns.reduce((s, t) => s + Math.abs(t.amount), 0),
      count: txns.length,
    }))
    .sort((a, b) => b.total - a.total)
  const topCcs   = ccEntries.slice(0, 5)
  const extraCcs = ccEntries.length - topCcs.length

  // ── Core posting loop ─────────────────────────────────────────────────────
  // Accepts remaining transactions + already-completed results (for resume).
  const runPostingLoop = useCallback(async (
    remaining: Transaction[],
    alreadyDone: PostResult[],
  ) => {
    const allResults: PostResult[] = [...alreadyDone]

    for (let i = 0; i < remaining.length; i++) {
      const t = remaining[i]
      setCurrent(t.description)

      try {
        const res = await fetch('/api/reckon/post-transactions', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ transactions: [t] }),
        })

        // ── 401: session ended mid-post ────────────────────────────────────
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}))
          const authErrorCode = ((data as { error?: string }).error ?? 'NOT_AUTHENTICATED') as AuthErrorCode
          const stillRemaining = remaining.slice(i) // current + everything after

          try {
            const key = `sbtc_post_paused_${period ?? 'current'}`
            sessionStorage.setItem(key, JSON.stringify({ posted: allResults, remaining: stillRemaining }))
          } catch { /* ignore quota errors */ }

          postingRef.current = false
          setCurrent('')
          setPaused({ authErrorCode, completedResults: allResults, remaining: stillRemaining })
          return  // exit loop — user must re-auth before resuming
        }

        const data   = await res.json()
        const result: PostResult = data.results?.[0] ?? {
          transactionId: t.reference,
          status:        'failed',
          error:         `HTTP ${res.status}`,
        }
        allResults.push(result)
        setLiveFeed(prev => [result, ...prev].slice(0, 3))
      } catch (err) {
        const result: PostResult = {
          transactionId: t.reference,
          status:        'failed',
          error:         err instanceof Error ? err.message : 'Network error',
        }
        allResults.push(result)
        setLiveFeed(prev => [result, ...prev].slice(0, 3))
      }

      setProgress(alreadyDone.length + i + 1)
    }

    // ── Finalise ──────────────────────────────────────────────────────────
    const succeeded  = allResults.filter(r => r.status === 'success').length
    const failed     = allResults.filter(r => r.status === 'failed').length
    const skipped    = allResults.filter(r => r.status === 'skipped').length
    const totalAmount = allResults
      .filter(r => r.status === 'success')
      .reduce((sum, r) => {
        const t = postable.find(t => t.reference === r.transactionId)
        return sum + Math.abs(t?.amount ?? 0)
      }, 0)

    const finalSummary: PostSummary = {
      total:      allResults.length,
      succeeded,
      failed,
      skipped,
      totalAmount,
      postedAt:   new Date().toISOString(),
    }

    const resultMap = new Map(allResults.map(r => [r.transactionId, r]))
    const updated = transactions.map(t => {
      const result = resultMap.get(t.reference)
      if (!result) return t
      if (result.status === 'success') return { ...t, postedToReckon: true, reckonId: result.reckonId, postError: undefined }
      if (result.status === 'failed')  return { ...t, postedToReckon: false, postError: result.error }
      return t
    })

    setResults(allResults)
    setSummary(finalSummary)
    setCurrent('')
    downloadCsvBackup(transactions)
    setScreen('results')
    onPosted(allResults, updated)
  }, [postable, transactions, period, onPosted])

  // ── Start posting ─────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (postingRef.current) return
    postingRef.current = true
    setScreen('posting')
    setProgress(0)
    setLiveFeed([])
    await runPostingLoop(postable, [])
  }

  // ── Resume after re-auth ──────────────────────────────────────────────────
  async function handleResume() {
    if (!paused || postingRef.current) return
    postingRef.current = true
    setProgress(paused.completedResults.length)
    setLiveFeed([])
    setPaused(null)
    await runPostingLoop(paused.remaining, paused.completedResults)
  }

  // ── Retry queue helpers ───────────────────────────────────────────────────
  function storeRetryQueue(failed: Transaction[]) {
    const key = `sbtc_retry_queue_${period ?? 'current'}`
    try { sessionStorage.setItem(key, JSON.stringify(failed)) } catch { /* ignore */ }
  }

  useEffect(() => {
    if (screen === 'results' && summary && summary.failed > 0) {
      const resultMap  = new Map(results.map(r => [r.transactionId, r]))
      const failedTxns = postable.filter(t => resultMap.get(t.reference)?.status === 'failed')
      storeRetryQueue(failedTxns)
    }
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Prevent close during posting ──────────────────────────────────────────
  function handleBackdropClick() {
    if (screen === 'posting' || paused) return
    onClose()
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        onClick={handleBackdropClick}
      >
        <div
          className="card w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Screen 1: Summary ────────────────────────────────────────── */}
          {screen === 'summary' && (
            <>
              <h2 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-1)' }}>
                Post to Reckon One
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
                Review before posting. Reckon-sourced and already-posted transactions are excluded.
              </p>

              {/* Totals */}
              <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg)' }}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>
                    {postable.length} transactions
                  </span>
                  <span className="font-semibold text-lg tabular-nums" style={{ color: 'var(--green)' }}>
                    {fmt(grandTotal)}
                  </span>
                </div>
                {period && (
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Period: {period}</p>
                )}
              </div>

              {/* Two buckets — ready vs unallocated */}
              {unallocatedCount != null && unallocatedCount > 0 && (
                <div className="mb-4 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--green)' }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--text-2)' }}>Ready to post</span>
                    <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text-1)' }}>
                      {postable.length} transaction{postable.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
                    <span className="text-sm flex-1" style={{ color: 'var(--text-3)' }}>
                      Not yet allocated — will not be included
                    </span>
                    <span className="text-sm tabular-nums" style={{ color: 'var(--text-3)' }}>
                      {unallocatedCount} transaction{unallocatedCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* By source */}
              <div className="mb-4">
                <p className="section-label mb-2">By source</p>
                {Object.entries(bySource).map(([src, txns]) => (
                  <div key={src} className="flex justify-between py-1.5 border-b text-sm" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--text-2)' }} className="capitalize">{src}</span>
                    <span style={{ color: 'var(--text-2)' }}>
                      {txns.length} txns &nbsp;
                      <span className="font-mono tabular-nums">{fmt(txns.reduce((s, t) => s + Math.abs(t.amount), 0))}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* By cost centre */}
              <div className="mb-5">
                <p className="section-label mb-2">By cost centre (top {topCcs.length})</p>
                {topCcs.map(({ code, total, count }) => (
                  <div key={code} className="flex justify-between py-1.5 border-b text-sm" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ color: 'var(--text-2)' }}>{code}</span>
                    <span style={{ color: 'var(--text-2)' }}>
                      <span className="font-mono tabular-nums">{fmt(total)}</span>
                      &nbsp; {count} txns
                    </span>
                  </div>
                ))}
                {extraCcs > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                    + {extraCcs} more cost centre{extraCcs > 1 ? 's' : ''}…
                  </p>
                )}
              </div>

              <p className="text-sm p-3 rounded-lg mb-5" style={{ background: 'rgba(29,158,117,0.07)', color: 'var(--text-2)' }}>
                A CSV backup will also be downloaded automatically.
              </p>

              <div className="flex gap-3 justify-end">
                <button className="btn-secondary" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleConfirm}>
                  Post to Reckon One →
                </button>
              </div>
            </>
          )}

          {/* ── Screen 2: Posting ────────────────────────────────────────── */}
          {screen === 'posting' && (
            <>
              <h2 className="font-semibold text-lg mb-5" style={{ color: 'var(--text-1)' }}>
                Posting to Reckon One…
              </h2>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--text-3)' }}>
                  <span>{progress} / {postable.length}</span>
                  <span>{Math.round((progress / postable.length) * 100)}%</span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{
                      background: 'var(--brand)',
                      width:      `${(progress / postable.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Live feed — last 3 completed */}
              <div className="mt-4 space-y-1.5 min-h-[80px]">
                {current && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-3)' }}>
                    <span className="animate-spin">⟳</span>
                    <span className="truncate">{current}</span>
                  </div>
                )}
                {[...liveFeed].map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: r.status === 'success' ? 'var(--green)' : 'var(--red)' }}>
                    <span>{r.status === 'success' ? '✓' : '✗'}</span>
                    <span className="truncate">{r.transactionId}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs mt-6" style={{ color: 'var(--text-3)' }}>
                Please don&apos;t close this window.
              </p>
            </>
          )}

          {/* ── Screen 3: Results ────────────────────────────────────────── */}
          {screen === 'results' && summary && (
            <>
              {summary.failed === 0 ? (
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: 'var(--green)', fontSize: '1.25rem' }}>✓</span>
                  <h2 className="font-semibold text-lg" style={{ color: 'var(--text-1)' }}>Posted to Reckon One</h2>
                </div>
              ) : (
                <h2 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-1)' }}>Posting complete</h2>
              )}

              <div className="rounded-lg p-4 mb-4 mt-3" style={{ background: 'var(--bg)' }}>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
                  {summary.succeeded} transaction{summary.succeeded !== 1 ? 's' : ''} posted successfully
                </p>
                <p className="tabular-nums font-mono text-sm mt-0.5" style={{ color: 'var(--green)' }}>
                  {fmt(summary.totalAmount)} total
                </p>
              </div>

              {summary.failed > 0 && (
                <div className="rounded-lg p-4 mb-4" style={{ background: 'rgba(185,28,28,0.06)', border: '1.5px solid rgba(185,28,28,0.2)' }}>
                  <p className="font-semibold text-sm mb-2" style={{ color: 'var(--red)' }}>
                    ⚠ {summary.failed} transaction{summary.failed !== 1 ? 's' : ''} failed
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
                    Failed transactions have been saved to the retry queue.
                  </p>
                  <button className="btn-secondary text-xs" onClick={onClose}>
                    View failed →
                  </button>
                </div>
              )}

              {summary.skipped > 0 && (
                <p className="text-sm mb-3" style={{ color: 'var(--text-3)' }}>
                  {summary.skipped} transaction{summary.skipped !== 1 ? 's were' : ' was'} skipped (already in Reckon or already posted).
                </p>
              )}

              <p className="text-sm p-3 rounded-lg mb-5" style={{ background: 'rgba(29,158,117,0.07)', color: 'var(--text-2)' }}>
                CSV backup downloaded automatically.
              </p>

              <div className="flex justify-end">
                <button className="btn-primary" onClick={onClose}>Done</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Re-auth modal — rendered above the posting modal ────────────── */}
      {paused && (
        <ReckonReauthModal
          errorCode={paused.authErrorCode}
          remainingCount={paused.remaining.length}
          totalCount={postable.length}
          onClose={onClose}
          onResumeAfterAuth={handleResume}
        />
      )}
    </>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}
