'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { JAN_2026, getTotalIncome, getTotalExpenses } from '@/lib/financialData'

const chartData = JAN_2026.pnl
  .filter(c => c.income > 0 || c.expenses > 0)
  .map(c => ({
    category: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    income: c.income,
    expenses: c.expenses,
  }))

export function BudgetOverview() {
  const totalIncome   = getTotalIncome(JAN_2026)
  const totalExpenses = getTotalExpenses(JAN_2026)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Income vs Expenses by Category</h3>
        <div className="text-sm text-gray-500">{JAN_2026.label}</div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 80 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="category" angle={-45} textAnchor="end" height={90} className="text-xs" />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
            <Tooltip formatter={(v: number) => `$${v.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`} />
            <Bar dataKey="income"   name="Income"   fill="#16a34a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.expenses > entry.income ? '#dc2626' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Total Income</div>
          <div className="text-lg font-semibold text-green-600">
            ${totalIncome.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-lg font-semibold text-red-600">
            ${totalExpenses.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  )
}
