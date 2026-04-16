import { NextResponse } from 'next/server'
import { connectWithCredentials, clearTokens, getSessionStatus } from '@/lib/reckon/auth'

/** POST /api/reckon/auth — connect using env var credentials (password flow) */
export async function POST() {
  try {
    await connectWithCredentials()
    return NextResponse.json(getSessionStatus())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/reckon/auth]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

/** DELETE /api/reckon/auth — end the current session */
export async function DELETE() {
  clearTokens()
  return NextResponse.json({ authenticated: false })
}
