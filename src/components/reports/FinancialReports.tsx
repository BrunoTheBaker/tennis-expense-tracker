'use client'

import { useState } from 'react'
import { PrinterIcon } from '@heroicons/react/24/outline'
import { PLReport } from './PLReport'
import { BalanceSheetReport } from './BalanceSheetReport'
import { DrinksReport } from './DrinksReport'

type ReportType = 'pl' | 'balance' | 'drinks'

const REPORTS: { id: ReportType; label: string }[] = [
  { id: 'pl',      label: 'Profit & Loss' },
  { id: 'balance', label: 'Balance Sheet' },
  { id: 'drinks',  label: 'Drinks POS'    },
]

export function FinancialReports() {
  const [active, setActive] = useState<ReportType>('pl')

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card flex items-center justify-between no-print">
        <div className="flex gap-2">
          {REPORTS.map(r => (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className={active === r.id ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <PrinterIcon className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Report */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {active === 'pl'      && <PLReport />}
        {active === 'balance' && <BalanceSheetReport />}
        {active === 'drinks'  && <DrinksReport />}
      </div>

      <p className="text-xs text-gray-400 no-print text-center">
        To save as PDF: Print → Save as PDF → Destination: Save as PDF
      </p>
    </div>
  )
}
