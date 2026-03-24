import { FinancialReports } from '@/components/reports/FinancialReports'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-2">
            Generate and view comprehensive financial reports for the tennis club
          </p>
        </div>
      </div>
      
      <FinancialReports />
    </div>
  )
}