import { NextResponse } from 'next/server'
import { getSessionStatus } from '@/lib/reckon/auth'

/** GET /api/reckon/session-status — returns current session state for the UI timer */
export async function GET() {
  return NextResponse.json(getSessionStatus())
}
