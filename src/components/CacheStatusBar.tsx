'use client'

interface Props {
  loadedAt: string  // ISO 8601
  count: number
  sources: { square: boolean; reckon: boolean; stripe: boolean }
  onRefresh: () => void
  onClear: () => void
}

export function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function CacheStatusBar({ loadedAt, count, sources, onRefresh, onClear }: Props) {
  const activeSources = (Object.entries(sources) as [string, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k)

  return (
    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
      <span>
        {count === 1 ? '1 transaction' : `${count} transactions`} loaded {timeAgo(loadedAt)}
        {activeSources.length > 0 && (
          <> · <span style={{ color: 'var(--brand)' }}>{activeSources.join(', ')}</span></>
        )}
      </span>
      <button type="button" onClick={onRefresh} className="underline hover:opacity-70">
        Refresh
      </button>
      <button type="button" onClick={onClear} className="underline hover:opacity-70">
        Clear
      </button>
    </div>
  )
}
