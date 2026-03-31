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
            <div className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Safety Bay Tennis Club</div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>Financial Report</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>Drinks Profit on Sales</div>
          <div className="text-xs" style={{ color: 'var(--text-3)' }}>
            {d.periodStart} to {d.periodEnd}
          </div>
        </div>
      </div>

      <table className="w-full">
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-2 font-semibold" style={{ color: 'var(--text-1)' }}>Sales</td>
            <td className="py-2 text-right font-mono font-semibold" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>${fmt(d.sales)}</td>
          </tr>
          <tr>
            <td className="py-1 pl-4" style={{ color: 'var(--text-2)' }}>Opening Stock</td>
            <td className="py-1 text-right font-mono" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>${fmt(d.openingStock)}</td>
          </tr>
          <tr>
            <td className="py-1 pl-4" style={{ color: 'var(--text-2)' }}>add Purchases</td>
            <td className="py-1 text-right font-mono" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>${fmt(d.purchases)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-1 pl-4" style={{ color: 'var(--text-2)' }}>less Closing Stock</td>
            <td className="py-1 text-right font-mono" style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>${fmt(d.closingStock)}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-2 font-semibold" style={{ color: 'var(--text-1)' }}>Cost of Goods Sold</td>
            <td className="py-2 text-right font-mono font-semibold" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>${fmt(d.cogs)}</td>
          </tr>
          <tr className="border-b-2 border-gray-800">
            <td className="py-3 font-bold" style={{ color: 'var(--text-1)' }}>Profit on Sales</td>
            <td className="py-3 text-right font-mono font-bold" style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>${fmt(d.profit)}</td>
          </tr>
          <tr>
            <td className="py-2" style={{ color: 'var(--text-2)' }}>Gross Profit %</td>
            <td className="py-2 text-right font-mono font-semibold" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{d.grossProfitPct}%</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 text-xs text-center" style={{ color: 'var(--text-3)' }}>
        Generated {new Date().toLocaleDateString('en-AU')} · Safety Bay Tennis Club
      </div>
    </div>
  )
}
