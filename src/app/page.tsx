'use client'

import { useState, useEffect, useCallback } from 'react'
import { PERIODS, LATEST_PERIOD_KEY, PERIOD_LABELS } from '@/lib/financialData'
import { getCachedPeriod, setCachedPeriod, clearCachedPeriod, setActivePeriodKey } from '@/lib/dataCache'
import { loadPeriodData } from '@/lib/dataLoader'
import type { PeriodCache } from '@/lib/dataCache'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import DataLoadingPanel from '@/components/DataLoadingPanel'
import CacheStatusBar from '@/components/CacheStatusBar'
import KpiCards from '@/components/dashboard/KpiCards'
import BankBalances from '@/components/dashboard/BankBalances'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import QuickActions from '@/components/dashboard/QuickActions'
import AiChatPlaceholder from '@/components/dashboard/AiChatPlaceholder'

export default function DashboardPage() {
  const [periodKey, setPeriodKey] = useState<string>('full-year')
  const [isLoading, setIsLoading] = useState(false)
  const [cache, setCache] = useState<PeriodCache | null>(null)

  const resolvedKey = periodKey === 'full-year' ? LATEST_PERIOD_KEY : periodKey
  const period = PERIODS[resolvedKey]
  const periodLabel = periodKey === 'full-year' ? 'Full Year 2025-26' : (PERIOD_LABELS[periodKey] ?? periodKey)

  const triggerLoad = useCallback(async (key: string) => {
    setIsLoading(true)
    try {
      const result = await loadPeriodData(key)
      const newCache: PeriodCache = {
        periodKey: key,
        transactions: result.transactions,
        loadedAt: new Date().toISOString(),
        sources: result.sources,
      }
      setCachedPeriod(newCache)
      setCache(newCache)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setActivePeriodKey(periodKey)
    const cached = getCachedPeriod(periodKey)
    if (cached) {
      setCache(cached)
    } else {
      setCache(null)
      triggerLoad(periodKey)
    }
  }, [periodKey, triggerLoad])

  function handleRefresh() {
    clearCachedPeriod(periodKey)
    setCache(null)
    triggerLoad(periodKey)
  }

  function handleClear() {
    clearCachedPeriod(periodKey)
    setCache(null)
  }

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

      {/* Live data status */}
      {isLoading && <DataLoadingPanel periodLabel={periodLabel} />}
      {!isLoading && cache && (
        <CacheStatusBar
          loadedAt={cache.loadedAt}
          count={cache.transactions.length}
          sources={cache.sources}
          onRefresh={handleRefresh}
          onClear={handleClear}
        />
      )}

      {/* KPI row — static financial data, unchanged */}
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
