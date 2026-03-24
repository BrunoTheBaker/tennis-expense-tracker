'use client'

import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

const recentExpenses = [
  {
    id: 1,
    description: 'Court Maintenance - Net Replacement',
    category: 'Maintenance',
    amount: 450,
    date: '2024-01-15',
    status: 'approved',
    submittedBy: 'John Smith'
  },
  {
    id: 2,
    description: 'Tournament Prize Money',
    category: 'Events',
    amount: 2500,
    date: '2024-01-14',
    status: 'pending',
    submittedBy: 'Sarah Wilson'
  },
  {
    id: 3,
    description: 'Clubhouse Utilities - January',
    category: 'Utilities',
    amount: 320,
    date: '2024-01-13',
    status: 'approved',
    submittedBy: 'Mike Johnson'
  },
  {
    id: 4,
    description: 'Coaching Equipment',
    category: 'Equipment',
    amount: 680,
    date: '2024-01-12',
    status: 'approved',
    submittedBy: 'Emma Davis'
  },
  {
    id: 5,
    description: 'Lawn Care Service',
    category: 'Maintenance',
    amount: 280,
    date: '2024-01-11',
    status: 'rejected',
    submittedBy: 'Tom Brown'
  },
]

const statusColors = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
}

export function RecentExpenses() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Expenses</h3>
        <Link 
          href="/expenses" 
          className="text-sm text-tennis-green-600 hover:text-tennis-green-700 font-medium"
        >
          View all
        </Link>
      </div>
      
      <div className="flow-root">
        <ul className="-my-3 divide-y divide-gray-200">
          {recentExpenses.map((expense) => (
            <li key={expense.id} className="py-3">
              <div className="flex items-center space-x-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {expense.description}
                    </p>
                    <div className="ml-2 flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[expense.status as keyof typeof statusColors]
                      }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{expense.category}</span>
                      <span className="mx-2">•</span>
                      <span>{expense.submittedBy}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-900 font-medium">
                      ${expense.amount.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}