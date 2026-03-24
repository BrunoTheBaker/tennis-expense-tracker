'use client'

import { useState } from 'react'
import { CsvUpload } from '@/components/transactions/CsvUpload'
import { ReviewTable } from '@/components/transactions/ReviewTable'
import { ProgressBar } from '@/components/transactions/ProgressBar'
import { ExportButton } from '@/components/transactions/ExportButton'
import type { Transaction } from '@/lib/financialData'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Import your monthly Reckon CSV to assign cost centres with AI assistance.
          </p>
        </div>
        <CsvUpload onLoaded={setTransactions} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {transactions.length} transactions loaded
          </p>
        </div>
        <div className="flex gap-3">
          <ExportButton transactions={transactions} />
          <button
            onClick={() => setTransactions([])}
            className="btn-secondary text-sm"
          >
            Upload new file
          </button>
        </div>
      </div>
      <ProgressBar
        confirmed={transactions.filter(t => t.status === 'confirmed').length}
        skipped={transactions.filter(t => t.status === 'skipped').length}
        total={transactions.length}
      />
      <ReviewTable transactions={transactions} onChange={setTransactions} />
    </div>
  )
}
