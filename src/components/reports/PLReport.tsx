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
            <div className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Safety Bay Tennis Club</div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Profit &amp; Loss</div>
          <div className="text-xs" style={{ color: 'var(--text-3)' }}>For {period.label}</div>
          <div className="text-xs" style={{ color: 'var(--text-3)' }}>Accrual basis</div>
        </div>
      </div>

      {/* Income */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Income</div>
        <table className="w-full">
          <tbody>
            {incomeRows.map(c => (
              <tr key={c.code} className="border-b border-gray-100">
                <td className="py-1" style={{ color: 'var(--text-2)' }}>{c.name}</td>
                <td className="py-1 text-right font-mono" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>${fmt(c.income)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2" style={{ color: 'var(--text-1)' }}>TOTAL INCOME</td>
              <td className="py-2 text-right font-mono" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>${fmt(totalIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Expenses */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>Expenses</div>
        <table className="w-full">
          <tbody>
            {expenseRows.map(c => (
              <tr key={c.code} className="border-b border-gray-100">
                <td className="py-1" style={{ color: 'var(--text-2)' }}>{c.name}</td>
                <td className="py-1 text-right font-mono" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>${fmt(c.expenses)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2" style={{ color: 'var(--text-1)' }}>TOTAL EXPENSES</td>
              <td className="py-2 text-right font-mono" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>${fmt(totalExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Position */}
      <div className="border rounded p-4" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center">
          <span className="text-base font-bold" style={{ color: 'var(--text-1)' }}>NET POSITION</span>
          <span className="text-xl font-bold font-mono" style={{ color: netPosition >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            ${fmt(netPosition)}
          </span>
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Surplus</div>
      </div>

      <div className="mt-6 text-xs text-center" style={{ color: 'var(--text-3)' }}>
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
