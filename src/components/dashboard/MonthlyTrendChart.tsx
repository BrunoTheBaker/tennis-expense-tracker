'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { PERIODS, PERIOD_LABELS, getOrderedPeriodKeys, getNetPosition } from '@/lib/financialData'

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export default function MonthlyTrendChart() {
  // Build data from all available periods, oldest first
  const keys = getOrderedPeriodKeys().reverse()
  const data = keys.map(key => ({
    month: PERIOD_LABELS[key] ?? key,
    netPosition: getNetPosition(PERIODS[key]),
  }))

  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-2)' }}>
        YTD Net Position — Monthly
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Line type="monotone" dataKey="netPosition" stroke="#1D9E75" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
