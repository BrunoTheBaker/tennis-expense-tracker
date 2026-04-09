'use client'

import type { SourceStatus } from '@/lib/dataCache'

interface Props {
  loadedAt: string
  count:    number
  sources: {
    square: SourceStatus
    reckon: SourceStatus
    stripe: SourceStatus
  }
  onRefresh: () => void
  onClear:   () => void
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function statusDot(s: SourceStatus): string {
  return s === 'ok' ? '🟢' : s === 'auth_required' ? '🔑' : '⚫'
}

export default function CacheStatusBar({ loadedAt, count, sources, onRefresh, onClear }: Props) {
  return (
    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
      <span>
        {count} transactions · loaded {timeAgo(loadedAt)}
      </span>

      <span className="flex items-center gap-1">
        {statusDot(sources.square)} Square
      </span>

      <span className="flex items-center gap-1">
        {statusDot(sources.reckon)} Reckon
        {sources.reckon === 'auth_required' && (
          <>
            {' '}—{' '}
            <a href="/api/reckon/auth" className="underline" style={{ color: 'var(--brand)' }}>
              Connect →
            </a>
          </>
        )}
      </span>

      <button onClick={onRefresh} className="underline hover:opacity-70">Refresh</button>
      <button onClick={onClear}   className="underline hover:opacity-70">Clear</button>
    </div>
  )
}
