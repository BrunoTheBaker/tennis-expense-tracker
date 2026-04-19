/**
 * POST /api/reckon/disconnect
 * Clears stored OAuth tokens — the treasurer must re-authenticate.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { clearTokens } from '@/lib/reckon/auth'

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const host   = req.headers.get('host')
  if (!origin || !host || !origin.endsWith(host)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  clearTokens()
  return NextResponse.json({ ok: true })
}
