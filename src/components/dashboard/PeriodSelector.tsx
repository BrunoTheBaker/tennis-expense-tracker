'use client'

import { getOrderedPeriodKeys, PERIOD_LABELS } from '@/lib/financialData'

interface Props {
  value: string
  onChange: (key: string) => void
}

export default function PeriodSelector({ value, onChange }: Props) {
  const keys = getOrderedPeriodKeys()

  return (
    <div className="flex items-center gap-3">
      <label className="section-label">Period</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field"
        style={{ width: 'auto', minWidth: '200px' }}
      >
        <option value="full-year">{PERIOD_LABELS['full-year']}</option>
        {keys.map(key => (
          <option key={key} value={key}>{PERIOD_LABELS[key] ?? key}</option>
        ))}
      </select>
    </div>
  )
}
