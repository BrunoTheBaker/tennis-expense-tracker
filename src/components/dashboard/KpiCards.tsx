import type { FinancialPeriod } from '@/lib/financialData'
import { getTotalIncome, getTotalExpenses, getNetPosition, getTotalCOGS } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
}

interface KpiCardProps {
  label: string
  value: number
  positive?: boolean   // if true, colour green; if false, colour red
  neutral?: boolean    // no colour tint (grey)
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function KpiCard({ label, value, positive, neutral }: KpiCardProps) {
  const colour = neutral ? 'var(--text-1)' : value >= 0 && positive !== false ? 'var(--green)' : 'var(--red)'
  return (
    <div className="card flex flex-col gap-2">
      <span className="section-label">{label}</span>
      <span
        className="font-mono text-[34px] font-medium leading-none"
        style={{ color: colour, fontFamily: 'var(--font-mono)' }}
      >
        {fmt(value)}
      </span>
    </div>
  )
}

export default function KpiCards({ period }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      <KpiCard label="Total Income"    value={getTotalIncome(period)}    positive />
      <KpiCard label="Total Expenses"  value={getTotalExpenses(period)}  neutral />
      <KpiCard label="Net Position"    value={getNetPosition(period)}    />
      <KpiCard label="COGS — Drinks"   value={getTotalCOGS(period)}      neutral />
    </div>
  )
}
