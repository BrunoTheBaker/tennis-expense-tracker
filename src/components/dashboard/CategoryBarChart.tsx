'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { FinancialPeriod } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
  mode: 'income' | 'expense'
  topN?: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export default function CategoryBarChart({ period, mode, topN = 8 }: Props) {
  const data = period.pnl
    .map(cat => ({ name: cat.name, value: mode === 'income' ? cat.income : cat.expenses }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, topN)

  const colour = mode === 'income' ? '#1D9E75' : '#1e3a5f'

  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-2)' }}>
        {mode === 'income' ? 'Income by Category' : 'Expenses by Category'}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
          <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colour} fillOpacity={1 - i * 0.08} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
