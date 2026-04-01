import { SquareApiError, type SquareApiErrorItem } from './types'

const SQUARE_BASE_URL = 'https://connect.squareup.com/v2'
const SQUARE_VERSION  = '2024-07-17'

export async function squareFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = process.env.SQUARE_ACCESS_TOKEN
  if (!token) {
    throw new Error('SQUARE_ACCESS_TOKEN is not configured')
  }

  const url = `${SQUARE_BASE_URL}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const data = await res.json() as T & { errors?: SquareApiErrorItem[] }

  if (!res.ok) {
    throw new SquareApiError(res.status, data.errors ?? [
      { category: 'API_ERROR', code: String(res.status), detail: res.statusText }
    ])
  }

  return data
}
