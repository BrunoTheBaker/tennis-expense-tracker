'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'

const budgetData = [
  { category: 'Maintenance', spent: 8500, budget: 10000 },
  { category: 'Equipment', spent: 4200, budget: 5000 },
  { category: 'Utilities', spent: 3800, budget: 4000 },
  { category: 'Events', spent: 6200, budget: 8000 },
  { category: 'Staff', spent: 12000, budget: 15000 },
  { category: 'Insurance', spent: 2400, budget: 3000 },
]

export function BudgetOverview() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Budget vs Actual</h3>
        <div className="text-sm text-gray-500">
          Current Month
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={budgetData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="category" 
              className="text-xs text-gray-600"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              className="text-xs text-gray-600"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Bar dataKey="budget" fill="#e5e7eb" name="Budget" radius={[2, 2, 0, 0]} />
            <Bar dataKey="spent" name="Spent" radius={[2, 2, 0, 0]}>
              {budgetData.map((entry, index) => {
                const percentage = (entry.spent / entry.budget) * 100;
                let color = '#16a34a'; // Green
                if (percentage > 90) color = '#dc2626'; // Red
                else if (percentage > 75) color = '#f59e0b'; // Yellow
                
                return <Cell key={`cell-${index}`} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Budget summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <div className="text-sm text-gray-500">Total Budget</div>
          <div className="text-lg font-semibold text-gray-900">
            ${budgetData.reduce((sum, item) => sum + item.budget, 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Spent</div>
          <div className="text-lg font-semibold text-gray-900">
            ${budgetData.reduce((sum, item) => sum + item.spent, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}