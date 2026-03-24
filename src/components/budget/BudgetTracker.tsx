'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

const budgetData = [
  {
    id: 1,
    category: 'Court Maintenance',
    budgetAnnual: 45000,
    budgetMonthly: 3750,
    spentYTD: 28500,
    spentThisMonth: 2850,
    lastUpdated: '2024-01-15',
    projects: [
      { name: 'Net Replacements', allocated: 5000, spent: 2400 },
      { name: 'Surface Repairs', allocated: 15000, spent: 12800 },
      { name: 'Lighting Updates', allocated: 10000, spent: 8200 },
      { name: 'Fencing Repairs', allocated: 8000, spent: 3100 },
    ]
  },
  {
    id: 2,
    category: 'Equipment & Supplies',
    budgetAnnual: 25000,
    budgetMonthly: 2083,
    spentYTD: 18200,
    spentThisMonth: 1680,
    lastUpdated: '2024-01-14',
    projects: [
      { name: 'Coaching Equipment', allocated: 8000, spent: 6800 },
      { name: 'Balls & Accessories', allocated: 6000, spent: 4200 },
      { name: 'First Aid Supplies', allocated: 2000, spent: 1200 },
      { name: 'Office Supplies', allocated: 3000, spent: 2100 },
    ]
  },
  {
    id: 3,
    category: 'Utilities',
    budgetAnnual: 18000,
    budgetMonthly: 1500,
    spentYTD: 14200,
    spentThisMonth: 1420,
    lastUpdated: '2024-01-13',
    projects: [
      { name: 'Electricity', allocated: 12000, spent: 9500 },
      { name: 'Water & Sewer', allocated: 4000, spent: 3200 },
      { name: 'Internet/Phone', allocated: 2000, spent: 1500 },
    ]
  },
  {
    id: 4,
    category: 'Events & Tournaments',
    budgetAnnual: 35000,
    budgetMonthly: 2917,
    spentYTD: 21500,
    spentThisMonth: 5200,
    lastUpdated: '2024-01-12',
    projects: [
      { name: 'Prize Money', allocated: 15000, spent: 12500 },
      { name: 'Event Supplies', allocated: 8000, spent: 4200 },
      { name: 'Catering', allocated: 7000, spent: 3100 },
      { name: 'Marketing', allocated: 5000, spent: 1700 },
    ]
  },
  {
    id: 5,
    category: 'Staff & Professional Services',
    budgetAnnual: 65000,
    budgetMonthly: 5417,
    spentYTD: 48200,
    spentThisMonth: 5100,
    lastUpdated: '2024-01-11',
    projects: [
      { name: 'Coaching Staff', allocated: 35000, spent: 28500 },
      { name: 'Maintenance Staff', allocated: 15000, spent: 11200 },
      { name: 'Accounting Services', allocated: 8000, spent: 5200 },
      { name: 'Legal & Insurance', allocated: 7000, spent: 3300 },
    ]
  },
]

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