/**
 * GET /api/reckon/auth
 * Redirects the browser to Reckon's OAuth login page.
 * After login, Reckon posts back to /api/reckon/callback.
 */
import { NextResponse } from 'next/server'
import { getAuthorizationUrl } from '@/lib/reckon/auth'
import { isReckonConfigured } from '@/lib/reckon'

export async function GET() {
  if (!isReckonConfigured()) {
    return NextResponse.json(
      { error: 'Reckon credentials not configured in .env.local' },
      { status: 503 }
    )
  }

  const url = getAuthorizationUrl()
  return NextResponse.redirect(url)
}
