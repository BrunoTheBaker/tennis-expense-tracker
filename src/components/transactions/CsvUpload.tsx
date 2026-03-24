'use client'

import { useRef } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import type { Transaction } from '@/lib/financialData'
import { parseReckonCsv } from '@/lib/csvParser'

interface Props {
  onLoaded: (transactions: Transaction[]) => void
}

export function CsvUpload({ onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const transactions = parseReckonCsv(text)
      onLoaded(transactions)
    }
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-tennis-green-500 transition-colors cursor-pointer"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-4 text-lg font-medium text-gray-900">Upload Reckon CSV</p>
      <p className="mt-2 text-sm text-gray-500">
        Export from Reckon: Reports → Transaction Reports → All Transactions → Export CSV
      </p>
      <p className="mt-1 text-xs text-gray-400">Drag and drop or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
