/**
 * Safe to import anywhere — no Node.js APIs, no secrets.
 * RECKON_* env vars without NEXT_PUBLIC_ prefix are undefined
 * on the client, so isReckonConfigured() always returns false
 * in the browser (correct behaviour).
 */

export function isReckonConfigured(): boolean {
  return !!(
    process.env.RECKON_CLIENT_ID &&
    process.env.RECKON_CLIENT_SECRET &&
    process.env.RECKON_SUBSCRIPTION_KEY &&
    process.env.RECKON_BOOK_ID &&
    process.env.RECKON_REDIRECT_URI &&
    process.env.RECKON_CLIENT_ID !== 'YOUR_CLIENT_ID'
  )
}
