import { ExpenseForm } from '@/components/expenses/ExpenseForm'

export default function NewExpensePage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
        <p className="text-gray-600 mt-2">
          Create a new expense entry for the tennis club
        </p>
      </div>
      
      <ExpenseForm />
    </div>
  )
}