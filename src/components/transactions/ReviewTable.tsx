'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Transaction } from '@/lib/financialData'
import { accounts } from '@/lib/accounts'
import CostCentrePicker from '@/components/allocation/CostCentrePicker'
import SquareTransactionPopover from '@/components/allocation/SquareTransactionPopover'

interface Props {
  transactions: Transaction[]
  onChange: (updated: Transaction[]) => void
}

export function ReviewTable({ transactions, onChange }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const handleSelect = useCallback((i: number, code: string) => {
    const account = accounts.find(a => a.code === code)
    const updated = transactions.map((t, idx) =>
      idx === i
        ? { ...t, accountCode: code, status: 'confirmed' as const, confidence: 'high' as const }
        : t
    )
    onChange(updated)
    // Silence unused variable — account name is stored in financialData, not needed here
    void account
  }, [transactions, onChange])

  const skip = useCallback((i: number) => {
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, status: 'skipped' as const } : t
    )
    onChange(updated)
  }, [transactions, onChange])

  const reopen = useCallback((i: number) => {
    const updated = transactions.map((t, idx) =>
      idx === i ? { ...t, accountCode: undefined, status: 'pending' as const } : t
    )
    onChange(updated)
  }, [transactions, onChange])

  // ── Partition into sections ───────────────────────────────────────────────
  type Section = { label: string; accent: string; items: Array<{ t: Transaction; i: number }> }

  const posted:     Array<{ t: Transaction; i: number }> = []
  const allocated:  Array<{ t: Transaction; i: number }> = []
  const unallocated: Array<{ t: Transaction; i: number }> = []
  const skipped:    Array<{ t: Transaction; i: number }> = []

  transactions.forEach((t, i) => {
    if (t.postedToReckon)        posted.push({ t, i })
    else if (t.status === 'confirmed') allocated.push({ t, i })
    else if (t.status === 'pending')   unallocated.push({ t, i })
    else if (t.status === 'skipped')   skipped.push({ t, i })
  })

  const sections: Section[] = [
    { label: `Allocated — ${allocated.length} ready to post`,           accent: 'var(--green)',  items: allocated  },
    { label: `Not yet allocated — ${unallocated.length} need a cost centre`, accent: '#f59e0b',  items: unallocated },
    { label: `Skipped — ${skipped.length}`,                             accent: 'var(--text-3)', items: skipped    },
    { label: `Posted — ${posted.length}`,                               accent: 'var(--text-3)', items: posted     },
  ].filter(s => s.items.length > 0)

  function renderRow(t: Transaction, i: number, accent: string) {
    const isPosted = t.postedToReckon === true
    const accentStyle: React.CSSProperties = { boxShadow: `inset 3px 0 0 ${accent}` }
    return (
      <tr key={i} style={{ opacity: isPosted ? 0.6 : 1 }}>
        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-2)', ...accentStyle }}>
          {t.date}
        </td>
        <td
          className="px-4 py-3 max-w-xs"
          style={{ color: 'var(--text-1)', position: 'relative' }}
          onMouseEnter={() => {
            if (t.source === 'square') {
              hoverTimerRef.current = setTimeout(() => setHoveredIdx(i), 200)
            }
          }}
          onMouseLeave={() => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
            setHoveredIdx(null)
          }}
        >
          <span className="block truncate">{t.description}</span>
          {t.source === 'square' && hoveredIdx === i && (
            <SquareTransactionPopover
              transaction={t}
              allTransactions={transactions}
            />
          )}
        </td>
        <td className={`px-4 py-3 text-right font-mono whitespace-nowrap ${t.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {t.amount >= 0 ? '+' : '−'}${Math.abs(t.amount).toFixed(2)}
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
          {isPosted ? (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(29,158,117,0.12)', color: 'var(--green)' }}>
              Posted ✓
            </span>
          ) : t.status === 'skipped' ? (
            <span className="text-gray-400 italic text-xs">Skipped</span>
          ) : (
            <CostCentrePicker
              transaction={t}
              currentCode={t.status === 'confirmed' ? t.accountCode : undefined}
              onSelect={(code: string) => handleSelect(i, code)}
              disabled={t.status === 'confirmed'}
            />
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex gap-2">
            {t.status === 'confirmed' && !isPosted && (
              <button
                onClick={() => reopen(i)}
                className="text-xs py-1 px-2 rounded border"
                style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
              >
                Reassign
              </button>
            )}
            {t.status === 'pending' && (
              <button
                onClick={() => skip(i)}
                className="text-xs py-1 px-2 text-gray-400 hover:text-gray-600"
              >
                Skip
              </button>
            )}
            {t.status === 'skipped' && (
              <button
                onClick={() => reopen(i)}
                className="text-xs py-1 px-2 text-gray-400 hover:text-gray-600"
              >
                Restore
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="space-y-3">
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead style={{ background: 'var(--bg)' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Date</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Description</th>
              <th className="px-4 py-3 text-right font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Amount</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Source</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Cost Centre</th>
              <th className="px-4 py-3 text-left font-medium uppercase" style={{ color: 'var(--text-3)', fontSize: '11px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(({ label, accent, items }) => (
              <React.Fragment key={label}>
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-xs font-semibold uppercase"
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--text-3)',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: accent }} />
                    {label}
                  </td>
                </tr>
                {items.map(({ t, i }) => renderRow(t, i, accent))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
