import { NextRequest, NextResponse } from 'next/server'
import { listPayments } from '@/lib/square/api'
import { squarePaymentToTransaction } from '@/lib/square/transforms'

const FY_START = '2025-03-01T00:00:00Z'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams
  const from = search.get('from') ?? FY_START
  const to   = search.get('to')   ?? new Date().toISOString()

  try {
    const payments = await listPayments(from, to)
    const transactions = payments.map(squarePaymentToTransaction)
    return NextResponse.json(transactions)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/square/payments]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
