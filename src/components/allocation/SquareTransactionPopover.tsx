'use client'

import type { Transaction } from '@/lib/financialData'
import { getOrderSiblings, getOrderTotal } from '@/lib/square/orderGroups'

interface Props {
  transaction: Transaction
  allTransactions: Transaction[]
}

/** Formats DD/MM/YYYY + time from ISO string (Perth AWST = UTC+8) */
function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  // Offset by +8 hours for Perth time
  const perth = new Date(d.getTime() + 8 * 60 * 60 * 1000)
  const day = perth.toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  })
  const time = perth.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
  })
  return `${day} ${time}`
}

export default function SquareTransactionPopover({ transaction, allTransactions }: Props) {
  const siblings = getOrderSiblings(transaction, allTransactions)
  const orderItems = [transaction, ...siblings].sort((a, b) => a.description.localeCompare(b.description))
  const orderTotal = getOrderTotal(transaction, allTransactions)
  const hasOrder = siblings.length > 0

  return (
    <div
      className="card absolute left-full top-0 ml-2 z-50 shadow-lg"
      style={{
        width: '300px',
        minWidth: '260px',
        fontSize: '13px',
        pointerEvents: 'none',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{ background: 'rgba(29,158,117,0.1)', borderBottom: '1px solid var(--border)' }}
      >
        <span style={{ color: '#1D9E75', fontWeight: 600, fontSize: '12px' }}>
          ■ Square transaction
        </span>
      </div>

      {/* Fields */}
      <div className="px-3 py-2 space-y-1" style={{ borderBottom: hasOrder ? '1px solid var(--border)' : undefined }}>
        <Row label="Category" value={transaction.squareCategory ?? '—'} />
        <Row label="Item"     value={transaction.squareItemName ?? '—'} />
        <Row label="Amount"   value={`$${transaction.amount.toFixed(2)}`} mono />
        <Row label="Date"     value={transaction.date} />
      </div>

      {/* Order siblings */}
      {hasOrder && (
        <div className="px-3 py-2">
          <p className="mb-1.5" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 500 }}>
            Part of order with {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-0.5">
            {orderItems.map((t, i) => (
              <div key={i} className="flex justify-between">
                <span style={{ color: 'var(--text-2)', fontSize: '12px' }} className="truncate mr-2">
                  {t.description}
                </span>
                <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px' }} className="shrink-0">
                  ${t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-3)', fontSize: '12px', fontWeight: 500 }}>Order total</span>
            <span style={{ color: 'var(--text-1)', fontFamily: 'var(--font-dm-mono)', fontSize: '12px', fontWeight: 600 }}>
              ${orderTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span style={{ color: 'var(--text-3)', fontSize: '12px', minWidth: '64px' }}>{label}</span>
      <span
        style={{
          color: 'var(--text-1)',
          fontSize: '12px',
          fontFamily: mono ? 'var(--font-dm-mono)' : undefined,
          textAlign: 'right',
        }}
        className="truncate"
      >
        {value}
      </span>
    </div>
  )
}
