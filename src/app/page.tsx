'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PERIODS } from '@/lib/financialData'
import { getCurrentPeriod } from '@/lib/periods'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import KpiCards from '@/components/dashboard/KpiCards'
import BankBalances from '@/components/dashboard/BankBalances'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import QuickActions from '@/components/dashboard/QuickActions'
import AiChatPlaceholder from '@/components/dashboard/AiChatPlaceholder'
import { loadPeriodData } from '@/lib/dataLoader'
import { setCachedPeriod, setActivePeriodKey } from '@/lib/dataCache'

export default function DashboardPage() {
  const [periodKey,  setPeriodKey]  = useState<string>(getCurrentPeriod())
  const [txnLoading, setTxnLoading] = useState(false)
  const [txnCount,   setTxnCount]   = useState<number | null>(null)

  const period = PERIODS[periodKey]

  // Load live transactions whenever the period changes
  useEffect(() => {
    let cancelled = false
    setTxnLoading(true)
    setTxnCount(null)

    loadPeriodData(periodKey)
      .then(result => {
        if (cancelled) return
        setCachedPeriod({
          periodKey,
          transactions: result.transactions,
          loadedAt:     new Date().toISOString(),
          sources:      result.sources,
        })
        setActivePeriodKey(periodKey)
        setTxnCount(result.transactions.length)
        setTxnLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setTxnLoading(false)
      })

    return () => { cancelled = true }
  }, [periodKey])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>
          Dashboard
        </h1>
        <PeriodSelector value={periodKey} onChange={setPeriodKey} />
      </div>

      {/* Transaction loading status */}
      {(txnLoading || txnCount !== null) && (
        <div className="flex items-center gap-3 text-sm px-1" style={{ color: 'var(--text-3)' }}>
          {txnLoading ? (
            <>
              <div
                className="h-3 w-3 rounded-full border-2 animate-spin flex-shrink-0"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--brand)' }}
              />
              <span>Loading transactions…</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--brand)' }}>✓</span>
              <span>{txnCount} transactions loaded</span>
              <Link href="/transactions" className="underline hover:opacity-70" style={{ color: 'var(--brand)' }}>
                Review in Allocation →
              </Link>
            </>
          )}
        </div>
      )}

      {/* Static financial data — only shown when period data is available */}
      {period ? (
        <>
          <KpiCards period={period} />

          <div className="grid grid-cols-2 gap-4">
            <CategoryBarChart period={period} mode="income" />
            <CategoryBarChart period={period} mode="expense" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CategoryPieChart period={period} mode="income" />
            <CategoryPieChart period={period} mode="expense" />
          </div>

          <div className="grid grid-cols-[1fr_400px] gap-4 items-start">
            <BankBalances period={period} />
            <div className="space-y-4">
              <QuickActions />
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-12" style={{ color: 'var(--text-3)' }}>
          No financial data available for this period yet.
          <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
            Monthly P&amp;L data is entered from Reckon exports after month-end.
          </p>
        </div>
      )}

      <AiChatPlaceholder />
    </div>
  )
}
