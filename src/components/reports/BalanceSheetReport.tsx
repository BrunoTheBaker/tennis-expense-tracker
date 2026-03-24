import Image from 'next/image'
import { JAN_2026 } from '@/lib/financialData'

export function BalanceSheetReport() {
  const period = JAN_2026
  const fmt = (n: number) =>
    n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const currentAssets    = period.balanceSheet.filter(l => l.section === 'current_assets')
  const nonCurrentAssets = period.balanceSheet.filter(l => l.section === 'non_current_assets')
  const equity           = period.balanceSheet.filter(l => l.section === 'equity')

  const totalCurrent    = currentAssets.reduce((s, l) => s + l.amount, 0)
  const totalNonCurrent = nonCurrentAssets.reduce((s, l) => s + l.amount, 0)
  const totalAssets     = totalCurrent + totalNonCurrent
  const totalEquity     = equity.reduce((s, l) => s + l.amount, 0)

  const Section = ({ title, rows, total, label }: {
    title: string
    rows: typeof currentAssets
    total: number
    label: string
  }) => (
    <div className="mb-5">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{title}</div>
      <table className="w-full">
        <tbody>
          {rows.map((l, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1 text-gray-700 pl-4">{l.name}</td>
              <td className="py-1 text-right font-mono text-gray-900">${fmt(l.amount)}</td>
            </tr>
          ))}
          <tr className="border-t border-gray-400 font-semibold">
            <td className="py-1 text-gray-900">{label}</td>
            <td className="py-1 text-right font-mono text-gray-900">${fmt(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto font-sans text-sm">
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/sbtc_logo.png" alt="SBTC" width={48} height={48} className="object-contain" />
          <div>
            <div className="text-lg font-bold text-gray-900">Safety Bay Tennis Club</div>
            <div className="text-xs text-gray-500">Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-gray-900">Balance Sheet</div>
          <div className="text-xs text-gray-500">As at {period.asAtDate}</div>
          <div className="text-xs text-gray-500">Accrual basis</div>
        </div>
      </div>

      <Section title="Current Assets"     rows={currentAssets}    total={totalCurrent}    label="Total Current Assets" />
      <Section title="Non-Current Assets" rows={nonCurrentAssets} total={totalNonCurrent} label="Total Non-Current Assets" />

      <div className="flex justify-between font-bold border-t-2 border-gray-800 pt-2 mb-6">
        <span>TOTAL ASSETS</span>
        <span className="font-mono">${fmt(totalAssets)}</span>
      </div>

      <Section title="Equity" rows={equity} total={totalEquity} label="Total Equity" />

      <div className="mt-6 text-xs text-gray-400 text-center">
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
