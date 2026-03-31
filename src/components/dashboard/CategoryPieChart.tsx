'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { FinancialPeriod } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
  mode: 'income' | 'expense'
}

const COLOURS = ['#1D9E75','#1e3a5f','#2563eb','#d97706','#7c3aed','#db2777','#059669','#0891b2']

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export default function CategoryPieChart({ period, mode }: Props) {
  const data = period.pnl
    .map(cat => ({ name: cat.name, value: mode === 'income' ? cat.income : cat.expenses }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-2)' }}>
        {mode === 'income' ? 'Income Split' : 'Expense Split'}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => <Cell key={i} fill={COLOURS[i % COLOURS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
