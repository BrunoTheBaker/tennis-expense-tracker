'use client'

import { StatsCards } from './StatsCards'
import { ExpenseChart } from './ExpenseChart'
import { RecentExpenses } from './RecentExpenses'
import { BudgetOverview } from './BudgetOverview'

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {/* Stats Cards */}
      <StatsCards />
      
      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ExpenseChart />
          <BudgetOverview />
        </div>
        <RecentExpenses />
      </div>
    </div>
  )
}