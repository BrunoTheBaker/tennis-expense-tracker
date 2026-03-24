import Image from 'next/image'
import { JAN_2026 } from '@/lib/financialData'

export function DrinksReport() {
  const d = JAN_2026.drinksPOS
  const fmt = (n: number) =>
    n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="bg-white p-8 max-w-xl mx-auto font-sans text-sm">
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Image src="/sbtc_logo.png" alt="SBTC" width={48} height={48} className="object-contain" />
          <div>
            <div className="text-lg font-bold text-gray-900">Safety Bay Tennis Club</div>
            <div className="text-xs text-gray-500">Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold text-gray-900">Drinks Profit on Sales</div>
          <div className="text-xs text-gray-500">
            {d.periodStart} to {d.periodEnd}
          </div>
        </div>
      </div>

      <table className="w-full">
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-2 font-semibold text-gray-900">Sales</td>
            <td className="py-2 text-right font-mono font-semibold text-gray-900">${fmt(d.sales)}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600 pl-4">Opening Stock</td>
            <td className="py-1 text-right font-mono text-gray-600">${fmt(d.openingStock)}</td>
          </tr>
          <tr>
            <td className="py-1 text-gray-600 pl-4">add Purchases</td>
            <td className="py-1 text-right font-mono text-gray-600">${fmt(d.purchases)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-1 text-gray-600 pl-4">less Closing Stock</td>
            <td className="py-1 text-right font-mono text-gray-600">${fmt(d.closingStock)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 font-semibold text-gray-900">Cost of Goods Sold</td>
            <td className="py-2 text-right font-mono font-semibold text-gray-900">${fmt(d.cogs)}</td>
          </tr>
          <tr className="border-b-2 border-gray-800">
            <td className="py-3 font-bold text-gray-900">Profit on Sales</td>
            <td className="py-3 text-right font-mono font-bold text-green-700">${fmt(d.profit)}</td>
          </tr>
          <tr>
            <td className="py-2 text-gray-700">Gross Profit %</td>
            <td className="py-2 text-right font-mono font-semibold text-gray-900">{d.grossProfitPct}%</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 text-xs text-gray-400 text-center">
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
