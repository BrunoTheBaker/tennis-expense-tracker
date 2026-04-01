import { NextRequest, NextResponse } from 'next/server'
import { getPayment } from '@/lib/square/api'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const payment = await getPayment(id)
    return NextResponse.json(payment)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[/api/square/payments/${id}]`, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
