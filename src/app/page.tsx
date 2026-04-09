'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PERIODS, LATEST_PERIOD_KEY } from '@/lib/financialData'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import KpiCards from '@/components/dashboard/KpiCards'
import BankBalances from '@/components/dashboard/BankBalances'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import QuickActions from '@/components/dashboard/QuickActions'
import AiChatPlaceholder from '@/components/dashboard/AiChatPlaceholder'
import { loadPeriodData } from '@/lib/dataLoader'
import { setCachedPeriod, setActivePeriodKey } from '@/lib/dataCache'

export default function DashboardPage() {
  const [periodKey,   setPeriodKey]   = useState<string>('full-year')
  const [txnLoading,  setTxnLoading]  = useState(false)
  const [txnCount,    setTxnCount]    = useState<number | null>(null)

  const resolvedKey = periodKey === 'full-year' ? LATEST_PERIOD_KEY : periodKey
  const period      = PERIODS[resolvedKey]

  // Load live transactions whenever the period changes
  useEffect(() => {
    let cancelled = false
    setTxnLoading(true)
    setTxnCount(null)

    loadPeriodData(periodKey)
      .then(result => {
        if (cancelled) return
        setCachedPeriod({
          periodKey:    resolvedKey,
          transactions: result.transactions,
          loadedAt:     new Date().toISOString(),
          sources:      result.sources,
        })
        setActivePeriodKey(resolvedKey)
        setTxnCount(result.transactions.length)
        setTxnLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setTxnLoading(false)
      })

    return () => { cancelled = true }
  }, [periodKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!period) {
    return (
      <div className="card text-center py-12" style={{ color: 'var(--text-3)' }}>
        No data available for this period yet.
      </div>
    )
  }

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

      {/* KPI row */}
      <KpiCards period={period} />

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <CategoryBarChart period={period} mode="income" />
        <CategoryBarChart period={period} mode="expense" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CategoryPieChart period={period} mode="income" />
        <CategoryPieChart period={period} mode="expense" />
      </div>

      {/* Monthly trend — only on full year */}
      {periodKey === 'full-year' && <MonthlyTrendChart />}

      {/* Bank balances + quick actions */}
      <div className="grid grid-cols-[1fr_400px] gap-4 items-start">
        <BankBalances period={period} />
        <div className="space-y-4">
          <QuickActions />
        </div>
      </div>

      {/* AI chat */}
      <AiChatPlaceholder />
    </div>
  )
}
