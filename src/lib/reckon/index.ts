export function isReckonConfigured(): boolean {
  const id       = process.env.RECKON_CLIENT_ID
  const secret   = process.env.RECKON_CLIENT_SECRET
  const key      = process.env.RECKON_SUBSCRIPTION_KEY
  const book     = process.env.RECKON_BOOK_ID
  const redirect = process.env.RECKON_REDIRECT_URI

  return (
    !!id       && id       !== 'YOUR_CLIENT_ID'        &&
    !!secret   && secret   !== 'YOUR_CLIENT_SECRET'    &&
    !!key      && key      !== 'YOUR_SUBSCRIPTION_KEY' &&
    !!book     && book     !== 'YOUR_BOOK_ID'           &&
    !!redirect
  )
}

export * from './types'
export * from './auth'
export * from './api'
export * from './transforms'
export * from './mock'
