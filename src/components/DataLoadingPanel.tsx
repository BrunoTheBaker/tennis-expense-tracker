'use client'

import type { SourceStatus } from '@/lib/dataCache'

interface Props {
  periodLabel: string
  sources?: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
}

export default function DataLoadingPanel({ periodLabel, sources }: Props) {
  const reckonNeedsAuth = sources?.reckon === 'auth_required'

  return (
    <div className="card space-y-2 py-3 px-4">
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full border-2 animate-spin flex-shrink-0"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--brand)' }}
        />
        <span className="text-sm" style={{ color: 'var(--text-2)' }}>
          Loading {periodLabel}…
        </span>
      </div>

      {reckonNeedsAuth && (
        <div className="flex items-center gap-2 text-xs pl-7" style={{ color: 'var(--text-3)' }}>
          <span>🔑 Reckon</span>
          <span style={{ color: 'var(--text-3)' }}>—</span>
          <a href="/api/reckon/auth" className="underline" style={{ color: 'var(--brand)' }}>
            Connect account →
          </a>
        </div>
      )}
    </div>
  )
}
