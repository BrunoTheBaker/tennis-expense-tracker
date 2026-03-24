import { BudgetTracker } from '@/components/budget/BudgetTracker'

export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Tracking</h1>
          <p className="text-gray-600 mt-2">
            Monitor spending against budget allocations across categories
          </p>
        </div>
      </div>
      
      <BudgetTracker />
    </div>
  )
}