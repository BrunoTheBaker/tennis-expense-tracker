'use client'

import { StatsCards } from './StatsCards'
import { ExpenseChart } from './ExpenseChart'

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

      {/* Charts */}
      <ExpenseChart />
    </div>
  )
}