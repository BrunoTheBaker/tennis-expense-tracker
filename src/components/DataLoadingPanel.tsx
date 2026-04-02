'use client'

interface Props {
  periodLabel: string
}

export default function DataLoadingPanel({ periodLabel }: Props) {
  return (
    <div className="card flex items-center gap-3 py-3 px-4">
      <div
        className="h-4 w-4 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--brand)' }}
      />
      <span className="text-sm" style={{ color: 'var(--text-2)' }}>
        Loading {periodLabel} from Square…
      </span>
    </div>
  )
}
