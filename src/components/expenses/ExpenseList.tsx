'use client'

import { useState } from 'react'
import { ChevronDownIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const expenses = [
  {
    id: 1,
    description: 'Court Maintenance - Net Replacement',
    category: 'Maintenance',
    amount: 450,
    date: '2024-01-15',
    status: 'approved',
    submittedBy: 'John Smith',
    vendor: 'Tennis Supply Co.',
    reference: 'INV-2024-001'
  },
  {
    id: 2,
    description: 'Tournament Prize Money',
    category: 'Events',
    amount: 2500,
    date: '2024-01-14',
    status: 'pending',
    submittedBy: 'Sarah Wilson',
    vendor: '',
    reference: 'EVENT-001'
  },
  {
    id: 3,
    description: 'Clubhouse Utilities - January',
    category: 'Utilities',
    amount: 320,
    date: '2024-01-13',
    status: 'approved',
    submittedBy: 'Mike Johnson',
    vendor: 'City Power & Light',
    reference: 'BILL-202401-15'
  },
  {
    id: 4,
    description: 'Coaching Equipment',
    category: 'Equipment',
    amount: 680,
    date: '2024-01-12',
    status: 'approved',
    submittedBy: 'Emma Davis',
    vendor: 'Pro Tennis Gear',
    reference: 'RCP-4421'
  },
  {
    id: 5,
    description: 'Lawn Care Service',
    category: 'Maintenance',
    amount: 280,
    date: '2024-01-11',
    status: 'rejected',
    submittedBy: 'Tom Brown',
    vendor: 'Green Thumb Landscaping',
    reference: 'SVC-001'
  },
]

const statusColors = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
}

export function ExpenseList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pr-10 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field pr-10 appearance-none"
            >
              <option value="all">All Categories</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Equipment">Equipment</option>
              <option value="Utilities">Utilities</option>
              <option value="Events">Events</option>
              <option value="Staff">Staff</option>
              <option value="Insurance">Insurance</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </div>
                      {expense.vendor && (
                        <div className="text-sm text-gray-500">
                          {expense.vendor}
                        </div>
                      )}
                      {expense.reference && (
                        <div className="text-xs text-gray-400">
                          Ref: {expense.reference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${expense.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      statusColors[expense.status as keyof typeof statusColors]
                    }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.submittedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredExpenses.length === 0 && (
          <div className="text-center py-8">
            <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>
      
      {/* Summary */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredExpenses.length}
            </div>
            <div className="text-sm text-gray-500">Total Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${filteredExpenses
                .filter(e => e.status === 'approved')
                .reduce((sum, e) => sum + e.amount, 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Approved Amount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              ${filteredExpenses
                .filter(e => e.status === 'pending')
                .reduce((sum, e) => sum + e.amount, 0)
                .toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Pending Amount</div>
          </div>
        </div>
      </div>
    </div>
  )
}