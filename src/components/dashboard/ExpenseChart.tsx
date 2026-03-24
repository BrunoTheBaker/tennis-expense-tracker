'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', expenses: 18500, budget: 25000 },
  { month: 'Feb', expenses: 22000, budget: 25000 },
  { month: 'Mar', expenses: 19800, budget: 25000 },
  { month: 'Apr', expenses: 24500, budget: 25000 },
  { month: 'May', expenses: 21200, budget: 25000 },
  { month: 'Jun', expenses: 26800, budget: 30000 },
  { month: 'Jul', expenses: 28500, budget: 30000 },
  { month: 'Aug', expenses: 24200, budget: 30000 },
  { month: 'Sep', expenses: 27100, budget: 30000 },
  { month: 'Oct', expenses: 29800, budget: 30000 },
  { month: 'Nov', expenses: 31200, budget: 30000 },
  { month: 'Dec', expenses: 24540, budget: 30000 },
]

export function ExpenseChart() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Expense Trends</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-tennis-green-600 rounded-full mr-2"></div>
            <span className="text-gray-600">Expenses</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-gray-600">Budget</span>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              className="text-xs text-gray-600"
            />
            <YAxis 
              className="text-xs text-gray-600"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              labelClassName="text-gray-600"
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px' 
              }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#16a34a" 
              strokeWidth={3}
              dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="budget" 
              stroke="#9ca3af" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}