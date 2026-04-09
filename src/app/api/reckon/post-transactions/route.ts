import { NextRequest, NextResponse } from 'next/server'
import { postTransactionBatch } from '@/lib/reckon/write'
import type { Transaction } from '@/lib/financialData'
import type { PostResult } from '@/lib/reckon/write'

export interface PostSummary {
  total: number
  succeeded: number
  failed: number
  skipped: number
  totalAmount: number
  postedAt: string
}

export interface PostTransactionsResponse {
  results: PostResult[]
  summary: PostSummary
}

export async function POST(req: NextRequest) {
  let transactions: Transaction[]

  try {
    const body = await req.json()
    transactions = body.transactions
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'transactions array required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const results = await postTransactionBatch(transactions)

  const succeeded = results.filter(r => r.status === 'success').length
  const failed    = results.filter(r => r.status === 'failed').length
  const skipped   = results.filter(r => r.status === 'skipped').length

  // Total amount = sum of successfully-posted transactions
  const successIds = new Set(results.filter(r => r.status === 'success').map(r => r.transactionId))
  const totalAmount = transactions
    .filter(t => successIds.has(t.reference || `${t.date}-${t.description}`))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const summary: PostSummary = {
    total:       results.length,
    succeeded,
    failed,
    skipped,
    totalAmount,
    postedAt:    new Date().toISOString(),
  }

  return NextResponse.json({ results, summary } satisfies PostTransactionsResponse)
}
