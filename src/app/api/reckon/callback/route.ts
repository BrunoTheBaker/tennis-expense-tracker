/**
 * GET /api/reckon/callback?code={code}&state={state}
 * Handles the OAuth redirect from Reckon's login page.
 * Validates CSRF state, exchanges code for tokens, then redirects to Settings.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { validateState, exchangeCodeForTokens } from '@/lib/reckon/auth'

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')

  if (!code || !state) {
    console.error('[reckon/callback] Missing code or state')
    return NextResponse.redirect(new URL('/settings?reckon=error', req.url))
  }

  if (!validateState(state)) {
    console.error('[reckon/callback] State mismatch — possible CSRF')
    return NextResponse.redirect(new URL('/settings?reckon=error', req.url))
  }

  try {
    await exchangeCodeForTokens(code)
    return NextResponse.redirect(new URL('/settings?reckon=connected', req.url))
  } catch (err) {
    console.error('[reckon/callback] Token exchange failed:', err)
    return NextResponse.redirect(new URL('/settings?reckon=error', req.url))
  }
}
