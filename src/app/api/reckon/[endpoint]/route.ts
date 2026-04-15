/**
 * Server-side proxy for Reckon One API calls.
 * Keeps credentials out of the browser — all Reckon requests must
 * go through this route handler.
 *
 * Usage: GET /api/reckon/<endpoint>?bookId=xxx&from=2025-03-01&to=2026-01-31
 *
 * Supported endpoints (maps to api.ts functions):
 *   transactions   → getTransactions(bookId, from, to)
 *   accounts       → getAccounts(bookId)
 *   bankaccounts   → getBankAccounts(bookId)
 *   ledger         → getLedgerReport(bookId, from, to)
 *
 * // TODO: RECKON API — add auth check (verify request is from our own app)
 * once the integration goes to production.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isReckonConfigured } from '@/lib/reckon'
import { ReckonAuthError } from '@/lib/reckon/ReckonAuthError'
import { getTransactions, getAccounts, getBankAccounts, getLedgerReport } from '@/lib/reckon/api'
import {
  MOCK_TRANSACTIONS,
  MOCK_ACCOUNTS,
  MOCK_BANK_ACCOUNTS,
  MOCK_LEDGER_ENTRIES,
} from '@/lib/reckon/mock'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params
  const search = req.nextUrl.searchParams

  const bookId = search.get('bookId') ?? undefined
  const fromStr = search.get('from')
  const toStr   = search.get('to')
  const from = fromStr ? new Date(fromStr) : new Date('2025-03-01')
  const to   = toStr   ? new Date(toStr)   : new Date()

  if (!isReckonConfigured()) {
    // Return mock data so the UI renders before credentials land
    const mockData = {
      transactions: MOCK_TRANSACTIONS,
      accounts:     MOCK_ACCOUNTS,
      bankaccounts: MOCK_BANK_ACCOUNTS,
      ledger:       MOCK_LEDGER_ENTRIES,
    }[endpoint]

    if (!mockData) {
      return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 404 })
    }

    return NextResponse.json({ data: mockData, _mock: true })
  }

  try {
    let data: unknown

    switch (endpoint) {
      case 'transactions':
        data = await getTransactions(bookId, from, to)
        break
      case 'accounts':
        data = await getAccounts(bookId)
        break
      case 'bankaccounts':
        data = await getBankAccounts(bookId)
        break
      case 'ledger':
        data = await getLedgerReport(bookId, from, to)
        break
      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof ReckonAuthError) {
      return NextResponse.json({ error: err.code }, { status: 401 })
    }
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[/api/reckon/${endpoint}]`, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
