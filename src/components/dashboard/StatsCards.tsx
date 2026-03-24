'use client'

import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const stats = [
  {
    name: 'Total Expenses',
    value: '$24,540',
    change: '+12%',
    changeType: 'increase' as const,
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Monthly Budget',
    value: '$30,000',
    change: '82% used',
    changeType: 'neutral' as const,
    icon: ChartBarIcon,
  },
  {
    name: 'This Month',
    value: '$8,420',
    change: '-5%',
    changeType: 'decrease' as const,
    icon: TrendingDownIcon,
  },
  {
    name: 'Pending Approvals',
    value: '7',
    change: '+2 new',
    changeType: 'increase' as const,
    icon: TrendingUpIcon,
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
              <dt className="text-sm font-medium text-gray-500 truncate">
                {stat.name}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </div>
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'increase' 
                    ? 'text-green-600' 
                    : stat.changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-600'
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