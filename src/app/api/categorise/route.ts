import { NextRequest, NextResponse } from 'next/server'
import { suggestCostCentre } from '@/lib/server/categoriser'

export async function POST(req: NextRequest) {
  try {
    const { description, amount } = await req.json() as {
      description: string
      amount: number
    }

    if (!description || amount === undefined) {
      return NextResponse.json({ error: 'description and amount required' }, { status: 400 })
    }

    const result = await suggestCostCentre(description, amount)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Categorise error:', err)
    // Return low-confidence fallback so the UI never blocks
    return NextResponse.json(
      { code: '', name: '', confidence: 'low' },
      { status: 200 }
    )
  }
}
