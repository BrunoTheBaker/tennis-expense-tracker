'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import type { Transaction } from '@/lib/financialData'
import { serialiseToReckonCsv } from '@/lib/csvParser'

interface Props {
  transactions: Transaction[]
}

export function ExportButton({ transactions }: Props) {
  const confirmed = transactions.filter(t => t.status === 'confirmed').length
  const total     = transactions.length

  function handleExport() {
    const csv  = serialiseToReckonCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `reckon-categorised-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleExport} className="btn-primary flex items-center gap-2">
      <ArrowDownTrayIcon className="h-5 w-5" />
      Export CSV ({confirmed}/{total} categorised)
    </button>
  )
}
