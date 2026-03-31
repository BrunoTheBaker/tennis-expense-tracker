'use client'

import { useState } from 'react'
import { PERIODS, LATEST_PERIOD_KEY } from '@/lib/financialData'
import PeriodSelector from '@/components/dashboard/PeriodSelector'
import KpiCards from '@/components/dashboard/KpiCards'
import BankBalances from '@/components/dashboard/BankBalances'
import CategoryBarChart from '@/components/dashboard/CategoryBarChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import MonthlyTrendChart from '@/components/dashboard/MonthlyTrendChart'
import QuickActions from '@/components/dashboard/QuickActions'
import AiChatPlaceholder from '@/components/dashboard/AiChatPlaceholder'

export default function DashboardPage() {
  const [periodKey, setPeriodKey] = useState<string>('full-year')

  const resolvedKey = periodKey === 'full-year' ? LATEST_PERIOD_KEY : periodKey
  const period = PERIODS[resolvedKey]

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
