import { ExpenseList } from '@/components/expenses/ExpenseList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all tennis club expenses
          </p>
        </div>
        
        <Link href="/expenses/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
        </Link>
      </div>
      
      <ExpenseList />
    </div>
  )
}