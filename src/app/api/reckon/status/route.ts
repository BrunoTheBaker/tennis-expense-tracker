/**
 * GET /api/reckon/status
 * Returns whether Reckon is configured and the treasurer is authenticated.
 * Used by ReckonIntegration.tsx to show connected/disconnected state.
 */
import { NextResponse } from 'next/server'
import { isAuthenticated, getAuthenticatedAt } from '@/lib/reckon/auth'
import { isReckonConfigured } from '@/lib/reckon'

export async function GET() {
  const configured = isReckonConfigured()
  const connected  = configured && isAuthenticated()

  return NextResponse.json({
    configured,
    connected,
    authenticatedAt: connected ? getAuthenticatedAt() : null,
  })
}
