import { NextRequest, NextResponse } from 'next/server'
import { connectWithCredentials, clearTokens, getSessionStatus } from '@/lib/reckon/auth'

/** POST /api/reckon/auth — exchange client credentials and start a session */
export async function POST(req: NextRequest) {
  let clientSecret: string | undefined
  try {
    const body = await req.json().catch(() => ({}))
    clientSecret = typeof body.clientSecret === 'string' ? body.clientSecret : undefined
  } catch { /* no body — use env var */ }

  try {
    await connectWithCredentials(clientSecret)
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
