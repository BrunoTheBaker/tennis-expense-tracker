'use client'

import { useState } from 'react'
import { DocumentArrowDownIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const expensesByCategory = [
  { name: 'Staff & Services', value: 48200, color: '#16a34a' },
  { name: 'Court Maintenance', value: 28500, color: '#22c55e' },
  { name: 'Events', value: 21500, color: '#4ade80' },
  { name: 'Equipment', value: 18200, color: '#86efac' },
  { name: 'Utilities', value: 14200, color: '#bbf7d0' },
]

const monthlyData = [
  { month: 'Jan', income: 25000, expenses: 18500, net: 6500 },
  { month: 'Feb', income: 28000, expenses: 22000, net: 6000 },
  { month: 'Mar', income: 32000, expenses: 19800, net: 12200 },
  { month: 'Apr', income: 35000, expenses: 24500, net: 10500 },
  { month: 'May', income: 30000, expenses: 21200, net: 8800 },
  { month: 'Jun', income: 38000, expenses: 26800, net: 11200 },
  { month: 'Jul', income: 42000, expenses: 28500, net: 13500 },
  { month: 'Aug', income: 36000, expenses: 24200, net: 11800 },
  { month: 'Sep', income: 34000, expenses: 27100, net: 6900 },
  { month: 'Oct', income: 31000, expenses: 29800, net: 1200 },
  { month: 'Nov', income: 29000, expenses: 31200, net: -2200 },
  { month: 'Dec', income: 33000, expenses: 24540, net: 8460 },
]

export function FinancialReports() {
  const [dateRange, setDateRange] = useState('year')
  const [reportType, setReportType] = useState('summary')

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // In a real app, this would trigger the actual export
    alert(`Exporting ${reportType} report as ${format.toUpperCase()}...`)
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Report Type */}
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-field"
              >
                <option value="summary">Financial Summary</option>
                <option value="detailed">Detailed Expenses</option>
                <option value="budget">Budget vs Actual</option>
                <option value="cashflow">Cash Flow</option>
                <option value="category">Category Breakdown</option>
              </select>
            </div>
            
            {/* Date Range */}
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleExportReport('pdf')}
              className="btn-secondary text-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Export PDF
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="btn-secondary text-sm"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-tennis-green-600" />
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Total Income</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                ${monthlyData.reduce((sum, month) => sum + month.income, 0).toLocaleString()}
              </dd>
              <div className="text-sm text-green-600">+8.2% vs last year</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Total Expenses</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                ${monthlyData.reduce((sum, month) => sum + month.expenses, 0).toLocaleString()}
              </dd>
              <div className="text-sm text-red-600">+12.1% vs last year</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Net Income</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                ${monthlyData.reduce((sum, month) => sum + month.net, 0).toLocaleString()}
              </dd>
              <div className="text-sm text-blue-600">-2.1% vs last year</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Avg Monthly</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                ${Math.round(monthlyData.reduce((sum, month) => sum + month.net, 0) / 12).toLocaleString()}
              </dd>
              <div className="text-sm text-purple-600">Net income</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Income vs Expenses */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Income vs Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs text-gray-600" />
                <YAxis 
                  className="text-xs text-gray-600"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px' 
                  }}
                />
                <Bar dataKey="income" fill="#16a34a" name="Income" />
                <Bar dataKey="expenses" fill="#dc2626" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Financial Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Monthly Financial Summary</h3>
          <div className="text-sm text-gray-500">All amounts in AUD</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyData.map((month, index) => {
                const margin = ((month.net / month.income) * 100).toFixed(1)
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month} 2024
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${month.income.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${month.expenses.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      month.net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${month.net.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      parseFloat(margin) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {margin}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  ${monthlyData.reduce((sum, month) => sum + month.income, 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  ${monthlyData.reduce((sum, month) => sum + month.expenses, 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  ${monthlyData.reduce((sum, month) => sum + month.net, 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  {(((monthlyData.reduce((sum, month) => sum + month.net, 0)) / 
                     (monthlyData.reduce((sum, month) => sum + month.income, 0))) * 100).toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}