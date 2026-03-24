import Image from 'next/image'
import { JAN_2026, getTotalIncome, getTotalExpenses, getNetPosition } from '@/lib/financialData'

export function PLReport() {
  const period = JAN_2026
  const totalIncome   = getTotalIncome(period)
  const totalExpenses = getTotalExpenses(period)
  const netPosition   = getNetPosition(period)
  const fmt = (n: number) =>
    n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const incomeRows  = period.pnl.filter(c => c.income > 0)
  const expenseRows = period.pnl.filter(c => c.expenses > 0)

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto font-sans text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/sbtc_logo.png" alt="SBTC" width={48} height={48} className="object-contain" />
          <div>
            <div className="text-lg font-bold text-gray-900">Safety Bay Tennis Club</div>
            <div className="text-xs text-gray-500">Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-gray-900">Profit &amp; Loss</div>
          <div className="text-xs text-gray-500">For {period.label}</div>
          <div className="text-xs text-gray-500">Accrual basis</div>
        </div>
      </div>

      {/* Income */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Income</div>
        <table className="w-full">
          <tbody>
            {incomeRows.map(c => (
              <tr key={c.code} className="border-b border-gray-100">
                <td className="py-1 text-gray-700">{c.name}</td>
                <td className="py-1 text-right font-mono text-gray-900">${fmt(c.income)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2 text-gray-900">TOTAL INCOME</td>
              <td className="py-2 text-right font-mono text-gray-900">${fmt(totalIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expenses */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Expenses</div>
        <table className="w-full">
          <tbody>
            {expenseRows.map(c => (
              <tr key={c.code} className="border-b border-gray-100">
                <td className="py-1 text-gray-700">{c.name}</td>
                <td className="py-1 text-right font-mono text-gray-900">${fmt(c.expenses)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2 text-gray-900">TOTAL EXPENSES</td>
              <td className="py-2 text-right font-mono text-gray-900">${fmt(totalExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Position */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">NET POSITION</span>
          <span className={`text-xl font-bold font-mono ${netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ${fmt(netPosition)}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">Surplus</div>
      </div>

      <div className="mt-6 text-xs text-gray-400 text-center">
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
