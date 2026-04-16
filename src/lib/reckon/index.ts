export * from './types'
export * from './auth'
export * from './api'
export * from './mock'

import { getSessionStatus } from './auth'

/**
 * Returns true only when all three Reckon env vars are set to real
 * (non-placeholder) values. Use this to decide whether to call the
 * live API or fall back to static/mock data.
 */
export function isReckonConfigured(): boolean {
  const id       = process.env.RECKON_CLIENT_ID
  const secret   = process.env.RECKON_CLIENT_SECRET
  const book     = process.env.RECKON_BOOK_ID
  const username = process.env.RECKON_USERNAME
  const password = process.env.RECKON_PASSWORD

  return (
    !!id       && id     !== 'YOUR_CLIENT_ID'     &&
    !!secret   && secret !== 'YOUR_CLIENT_SECRET' &&
    !!book     && book   !== 'YOUR_BOOK_ID'       &&
    !!username &&
    !!password
  )
}

/**
 * Returns true when a valid, non-expired, active session exists.
 * Equivalent to getSessionStatus().authenticated.
 */
export function isAuthenticated(): boolean {
  return getSessionStatus().authenticated
}
