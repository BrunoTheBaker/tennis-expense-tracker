'use client'

import { generatePeriodOptions } from '@/lib/periods'

interface Props {
  value: string
  onChange: (key: string) => void
}

export default function PeriodSelector({ value, onChange }: Props) {
  const groups = generatePeriodOptions()

  return (
    <div className="flex items-center gap-3">
      <label className="section-label">Period</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input-field"
        style={{ width: 'auto', minWidth: '200px' }}
      >
        {groups.map(group => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
