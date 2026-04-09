'use client'

import { generatePeriodOptions } from '@/lib/periods'

interface Props {
  value: string
  onChange: (key: string) => void
}

export default function PeriodSelector({ value, onChange }: Props) {
  const options = generatePeriodOptions()
  const months  = options.filter(o => o.type === 'month')
  const fyOpts  = options.filter(o => o.type === 'financial-year')

  return (
    <div className="flex items-center gap-3">
      <label className="section-label">Period</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field"
        style={{ width: 'auto', minWidth: '200px' }}
      >
        <optgroup label="Monthly">
          {months.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </optgroup>
        <optgroup label="Financial Year">
          {fyOpts.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
