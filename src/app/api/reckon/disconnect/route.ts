/**
 * POST /api/reckon/disconnect
 * Clears stored OAuth tokens — the treasurer must re-authenticate.
 */
import { NextResponse } from 'next/server'
import { clearTokens } from '@/lib/reckon/auth'

export async function POST() {
  clearTokens()
  return NextResponse.json({ ok: true })
}
