/**
 * Server-side proxy for Reckon One API calls.
 * Keeps credentials out of the browser — all Reckon requests must
 * go through this route handler.
 *
 * Usage: GET /api/reckon/<endpoint>?from=2025-03-01&to=2026-01-31
 *
 * Supported endpoints:
 *   transactions   → getLedgerTransactions(from, to)
 *   accounts       → getAccounts()
 *   bankaccounts   → getBankBalances()
 *   ledger         → falls back to mock (legacy)
 *
 * Status responses:
 *   { status: 'not_configured' } — env vars not set
 *   { status: 'auth_required'  } — treasurer has not authenticated
 *   { data: [...] }             — success
 */

import { NextRequest, NextResponse } from 'next/server'
import { isReckonConfigured } from '@/lib/reckon'
import { isAuthenticated } from '@/lib/reckon/auth'
import { getLedgerTransactions, getAccounts, getBankBalances } from '@/lib/reckon/api'
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
  const search  = req.nextUrl.searchParams
  const fromStr = search.get('from')
  const toStr   = search.get('to')
  const from = fromStr ?? '2025-03-01'
  const to   = toStr   ?? new Date().toISOString().slice(0, 10)

  if (!isReckonConfigured()) {
    // Return mock data so the UI renders before credentials are set
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

  if (!isAuthenticated()) {
    return NextResponse.json({ status: 'auth_required', data: [] }, { status: 401 })
  }

  try {
    let data: unknown

    switch (endpoint) {
      case 'transactions':
        data = await getLedgerTransactions(from, to)
        break
      case 'accounts':
        data = await getAccounts()
        break
      case 'bankaccounts':
        data = await getBankBalances()
        break
      case 'ledger':
        // Legacy — return mock until ledger report endpoint is confirmed
        data = MOCK_LEDGER_ENTRIES
        break
      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[/api/reckon/${endpoint}]`, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
