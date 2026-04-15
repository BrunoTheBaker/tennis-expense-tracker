'use client'

import { useState } from 'react'
import { PERIODS, emptyPeriod } from '@/lib/financialData'
import { getCurrentPeriod } from '@/lib/periods'
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
  const [periodKey, setPeriodKey] = useState<string>(getCurrentPeriod())

  const period = PERIODS[periodKey] ?? emptyPeriod()

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

      {loadError && (
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Could not load live data: {loadError}
        </p>
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

      {/* Monthly trend — only on FY views */}
      {periodKey.endsWith('-FY') && <MonthlyTrendChart />}

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
