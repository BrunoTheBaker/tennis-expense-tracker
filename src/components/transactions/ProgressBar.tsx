interface Props {
  confirmed: number
  skipped: number
  total: number
}

export function ProgressBar({ confirmed, skipped, total }: Props) {
  const done = confirmed + skipped
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {done} / {total} transactions categorised
        </span>
        <span className="text-sm text-gray-500">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-tennis-green-600 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="text-green-600">✓ {confirmed} confirmed</span>
        <span className="text-gray-400">⟶ {skipped} skipped</span>
        <span className="text-orange-500">◌ {total - done} pending</span>
      </div>
    </div>
  )
}
