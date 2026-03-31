'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Transaction } from '@/lib/financialData'
import { accounts } from '@/lib/accounts'
import { getCachedSuggestion, setCachedSuggestion } from '@/lib/merchantCache'

interface Props {
  transactions: Transaction[]
  onChange: (updated: Transaction[]) => void
}

interface Suggestion {
  code: string
  name: string
  confidence: 'high' | 'medium' | 'low'
  loading: boolean
}

const CONFIDENCE_ICON: Record<string, string> = { high: '✓', medium: '~', low: '?' }
const CONFIDENCE_COLOUR: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-yellow-500',
  low: 'text-red-500',
}

export function ReviewTable({ transactions, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<Record<number, Suggestion>>({})
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  // Track which row indices have already had a fetch dispatched, to avoid re-fetching
  const fetchedRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    transactions.forEach((t, i) => {
      if (t.status !== 'pending') return
      if (fetchedRef.current.has(i)) return

      fetchedRef.current.add(i)

      // Check cache first
      const cached = getCachedSuggestion(t.description)
      if (cached) {
        setSuggestions(s => ({ ...s, [i]: { ...cached, loading: false } }))
        return
      }

      // Mark loading
      setSuggestions(s => ({ ...s, [i]: { code: '', name: '', confidence: 'low', loading: true } }))

      // Call AI API
      fetch('/api/categorise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: t.description, amount: t.amount }),
      })
        .then(r => r.json())
        .then((result: { code: string; name: string; confidence: 'high' | 'medium' | 'low' }) => {
          setSuggestions(s => ({ ...s, [i]: { ...result, loading: false } }))
        })
        .catch(() => {
          setSuggestions(s => ({ ...s, [i]: { code: '', name: 'Error — assign manually', confidence: 'low', loading: false } }))
        })
    })
  }, [transactions])

  const confirm = useCallback((i: number) => {
    const sug = suggestions[i]
    if (!sug || !sug.code) return
    setCachedSuggestion(transactions[i].description, sug.code, sug.name)
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, accountCode: sug.code, status: 'confirmed' as const, confidence: sug.confidence } : t
    )
    onChange(updated)
  }, [suggestions, transactions, onChange])

  const skip = useCallback((i: number) => {
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, status: 'skipped' as const } : t
    )
    onChange(updated)
  }, [transactions, onChange])

  const assignManual = useCallback((i: number, code: string) => {
    const account = accounts.find(a => a.code === code)
    if (!account) return
    setCachedSuggestion(transactions[i].description, code, account.name)
    setSuggestions(s => ({ ...s, [i]: { code, name: account.name, confidence: 'high', loading: false } }))
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, accountCode: code, status: 'confirmed' as const, confidence: 'high' as const } : t
    )
    onChange(updated)
    setEditingIdx(null)
  }, [transactions, onChange])

  const acceptAll = useCallback(() => {
    const updated = transactions.map((t, i) => {
      if (t.status !== 'pending') return t
      const sug = suggestions[i]
      if (!sug?.code || sug.loading) return t
      setCachedSuggestion(t.description, sug.code, sug.name)
      return { ...t, accountCode: sug.code, status: 'confirmed' as const, confidence: sug.confidence }
    })
    onChange(updated)
  }, [suggestions, transactions, onChange])

  const pendingWithSuggestion = transactions.filter((t, i) =>
    t.status === 'pending' && suggestions[i]?.code && !suggestions[i]?.loading
  ).length

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          {transactions.length} transactions
        </p>
        {pendingWithSuggestion > 0 && (
          <button onClick={acceptAll} className="btn-primary text-sm">
            Accept All AI Proposals ({pendingWithSuggestion})
          </button>
        )}
      </div>
      <div className="card overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead style={{ background: 'var(--bg)' }}>
          <tr>
            <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Date</th>
            <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Description</th>
            <th className="px-4 py-3 text-right font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Amount</th>
            <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Source</th>
            <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Proposed Account</th>
            <th className="px-4 py-3 text-left font-medium uppercase text-xs" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((t, i) => {
            const sug = suggestions[i]
            const isDone = t.status === 'confirmed' || t.status === 'skipped'
            return (
              <tr key={i} className={isDone ? 'bg-gray-50 opacity-60' : 'hover:bg-blue-50'}>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{t.date}</td>
                <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{t.description}</td>
                <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    background: t.source === 'square' ? 'rgba(29,158,117,0.1)' :
                                t.source === 'stripe' ? 'rgba(30,58,95,0.1)' : 'rgba(107,114,128,0.1)',
                    color: t.source === 'square' ? 'var(--brand)' :
                           t.source === 'stripe' ? 'var(--nav)' : 'var(--text-3)',
                  }}>
                    {t.source ?? 'reckon'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {t.status === 'confirmed' ? (
                    <span className="text-green-700">{t.accountCode} {accounts.find(a => a.code === t.accountCode)?.name}</span>
                  ) : t.status === 'skipped' ? (
                    <span className="text-gray-400 italic">Skipped</span>
                  ) : editingIdx === i ? (
                    <select
                      autoFocus
                      className="input-field text-sm py-1"
                      defaultValue=""
                      onChange={(e) => assignManual(i, e.target.value)}
                      onBlur={() => setEditingIdx(null)}
                    >
                      <option value="" disabled>Select cost centre…</option>
                      {accounts.map(a => (
                        <option key={a.code} value={a.code}>{a.code} {a.name}</option>
                      ))}
                    </select>
                  ) : sug?.loading ? (
                    <span className="text-gray-400 animate-pulse">Analysing…</span>
                  ) : sug ? (
                    <span className={`font-medium ${CONFIDENCE_COLOUR[sug.confidence]}`}>
                      {CONFIDENCE_ICON[sug.confidence]} {sug.code} {sug.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {!isDone && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirm(i)}
                        disabled={!sug?.code || sug.loading}
                        className="btn-primary text-xs py-1 px-2 disabled:opacity-40"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setEditingIdx(i)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => skip(i)}
                        className="text-gray-400 hover:text-gray-600 text-xs py-1 px-2"
                      >
                        Skip
                      </button>
                    </div>
                  )}
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
