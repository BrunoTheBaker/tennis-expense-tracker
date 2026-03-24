'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { JAN_2026 } from '@/lib/financialData'

const budgetData = JAN_2026.pnl
  .filter(c => c.expenses > 0)
  .map((c, i) => ({
    id: i + 1,
    category: c.name,
    budgetAnnual: Math.round(c.expenses * 1.1), // 10% buffer as indicative annual budget
    spentYTD: c.expenses,
    budgetMonthly: Math.round((c.expenses * 1.1) / 11), // 11 months into FY
    spentThisMonth: 0, // not available at category level without monthly breakdown
    lastUpdated: '2026-01-31',
    projects: [] as { name: string; allocated: number; spent: number }[],
  }))


export function BudgetTracker() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const getUtilizationStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100
    if (percentage >= 95) return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100', icon: ExclamationTriangleIcon }
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: ClockIcon }
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircleIcon }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Budget</h3>
          <div className="text-3xl font-bold text-gray-900">
            ${budgetData.reduce((sum, item) => sum + item.budgetAnnual, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total allocated</div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Year to Date</h3>
          <div className="text-3xl font-bold text-tennis-green-600">
            ${budgetData.reduce((sum, item) => sum + item.spentYTD, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {Math.round((budgetData.reduce((sum, item) => sum + item.spentYTD, 0) / 
                        budgetData.reduce((sum, item) => sum + item.budgetAnnual, 0)) * 100)}% utilized
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">This Month</h3>
          <div className="text-3xl font-bold text-gray-900">
            ${budgetData.reduce((sum, item) => sum + item.spentThisMonth, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">Current month spending</div>
        </div>
      </div>

      {/* Category Budget Breakdown */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Budget by Category</h3>
        
        <div className="space-y-4">
          {budgetData.map((category) => {
            const ytdUtilization = getUtilizationStatus(category.spentYTD, category.budgetAnnual)
            const monthlyUtilization = getUtilizationStatus(category.spentThisMonth, category.budgetMonthly)
            const ytdPercentage = Math.round((category.spentYTD / category.budgetAnnual) * 100)
            const monthlyPercentage = Math.round((category.spentThisMonth / category.budgetMonthly) * 100)
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{category.category}</h4>
                    <ytdUtilization.icon className={`h-5 w-5 ${ytdUtilization.color}`} />
                  </div>
                  <button
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    className="text-sm text-tennis-green-600 hover:text-tennis-green-700 font-medium"
                  >
                    {selectedCategory === category.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>
                
                {/* Annual Budget Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Annual Progress</span>
                    <span>${category.spentYTD.toLocaleString()} / ${category.budgetAnnual.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        ytdPercentage >= 95 ? 'bg-red-500' : 
                        ytdPercentage >= 80 ? 'bg-yellow-500' : 'bg-tennis-green-500'
                      }`}
                      style={{ width: `${Math.min(ytdPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{ytdPercentage}% utilized</div>
                </div>
                
                {/* Monthly Budget Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Monthly Progress</span>
                    <span>${category.spentThisMonth.toLocaleString()} / ${category.budgetMonthly.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        monthlyPercentage >= 95 ? 'bg-red-500' : 
                        monthlyPercentage >= 80 ? 'bg-yellow-500' : 'bg-tennis-green-500'
                      }`}
                      style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{monthlyPercentage}% of monthly budget</div>
                </div>
                
                {/* Project Details */}
                {selectedCategory === category.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Project Breakdown</h5>
                    <div className="space-y-3">
                      {category.projects.map((project, index) => {
                        const projectPercentage = Math.round((project.spent / project.allocated) * 100)
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{project.name}</span>
                                <span className="text-gray-600">
                                  ${project.spent.toLocaleString()} / ${project.allocated.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    projectPercentage >= 95 ? 'bg-red-400' : 
                                    projectPercentage >= 80 ? 'bg-yellow-400' : 'bg-tennis-green-400'
                                  }`}
                                  style={{ width: `${Math.min(projectPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{projectPercentage}% utilized</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-3">
                  Last updated: {new Date(category.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}