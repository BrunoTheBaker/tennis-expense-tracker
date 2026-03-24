'use client'

import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { JAN_2026, getTotalIncome, getTotalExpenses, getNetPosition } from '@/lib/financialData'

const totalIncome   = getTotalIncome(JAN_2026)
const totalExpenses = getTotalExpenses(JAN_2026)
const netPosition   = getNetPosition(JAN_2026)
const drinksProfit  = JAN_2026.drinksPOS.profit

type StatCard = {
  name: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
}

const stats: StatCard[] = [
  {
    name: 'Total Income (YTD)',
    value: `$${totalIncome.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: JAN_2026.label,
    changeType: 'neutral',
    icon: ArrowTrendingUpIcon,
  },
  {
    name: 'Total Expenses (YTD)',
    value: `$${totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: JAN_2026.label,
    changeType: 'neutral',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Net Position',
    value: `$${netPosition.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: 'Surplus',
    changeType: 'increase',
    icon: ChartBarIcon,
  },
  {
    name: 'Drinks Profit',
    value: `$${drinksProfit.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change: `${JAN_2026.drinksPOS.grossProfitPct}% GP`,
    changeType: 'increase',
    icon: ArrowTrendingDownIcon,
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.name} className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon className="h-6 w-6 text-tennis-green-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'increase'
                    ? 'text-green-600'
                    : stat.changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}>
                  {stat.change}
                </div>
              </dd>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}