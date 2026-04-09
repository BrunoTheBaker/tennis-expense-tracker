'use client'

import { useState } from 'react'
import type { Transaction } from '@/lib/financialData'
import { accounts } from '@/lib/accounts'

interface Props {
  transactions: Transaction[]
  onConfirm: () => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n)
}

export default function AllocationGate({ transactions, onConfirm }: Props) {
  const [open, setOpen] = useState(false)

  const confirmed = transactions.filter(t => t.status === 'confirmed')
  const skipped   = transactions.filter(t => t.status === 'skipped')
  const pending   = transactions.filter(t => t.status === 'pending')
  const allDone   = pending.length === 0

  // Group confirmed by account code
  const byCode = confirmed.reduce<Record<string, { name: string; total: number }>>((acc, t) => {
    const code = t.accountCode ?? 'unassigned'
    const name = accounts.find(a => a.code === code)?.name ?? code
    if (!acc[code]) acc[code] = { name, total: 0 }
    acc[code].total += t.amount
    return acc
  }, {})

  const grandTotal = confirmed.reduce((s, t) => s + t.amount, 0)

  return (
    <>
      <div className="card flex items-center justify-between">
        <div className="text-sm" style={{ color: 'var(--text-2)' }}>
          {confirmed.length} confirmed · {skipped.length} skipped · {pending.length} pending
        </div>
        <button
          className="btn-primary"
          disabled={!allDone}
          onClick={() => setOpen(true)}
          title={!allDone ? `${pending.length} transactions still need a cost centre` : undefined}
        >
          Review &amp; Post
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-1)' }}>
              Confirm Allocation
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
              You are about to post <strong>{confirmed.length} transactions</strong> to Reckon One.
              {skipped.length > 0 && ` ${skipped.length} skipped transactions will not be affected.`}
            </p>

            {/* Breakdown */}
            <div className="mb-4">
              <p className="section-label mb-2">Breakdown by Account</p>
              {Object.entries(byCode).map(([code, { name, total }]) => (
                <div key={code} className="flex justify-between py-1.5 border-b text-sm" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--text-2)' }}>{code} {name}</span>
                  <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: total >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {fmt(total)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-semibold text-sm">
                <span>Total</span>
                <span className="font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(grandTotal)}</span>
              </div>
            </div>

            <div className="text-sm p-3 rounded-lg mb-4" style={{ background: 'rgba(29,158,117,0.07)', color: 'var(--text-2)' }}>
              Transactions with source <strong>reckon</strong> are already in Reckon and will be excluded from posting.
              A CSV backup is downloaded automatically.
            </div>

            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => { setOpen(false); onConfirm() }}>
                Post to Reckon One →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
