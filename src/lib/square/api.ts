import { squareFetch } from './client'
import type { Payment, Money, ListPaymentsResponse, GetPaymentResponse, SquareLocation, ListLocationsResponse } from './types'

/**
 * List all payments in a date range, auto-paginating until no cursor is returned.
 * Always filters to SQUARE_LOCATION_ID unless locationId is explicitly passed as ''.
 */
export async function listPayments(
  from: string,
  to: string,
  locationId?: string
): Promise<Payment[]> {
  const location = locationId ?? process.env.SQUARE_LOCATION_ID
  const results: Payment[] = []
  let cursor: string | undefined

  try {
    do {
      const params = new URLSearchParams({
        begin_time: from,
        end_time: to,
        limit: '100',
        ...(location ? { location_id: location } : {}),
        ...(cursor    ? { cursor }               : {}),
      })

      const data = await squareFetch<ListPaymentsResponse>(`/payments?${params}`)
      if (data.payments) results.push(...data.payments)
      cursor = data.cursor
    } while (cursor)
  } catch (err) {
    console.warn('[square/api] listPayments failed:', err)
    return []
  }

  return results
}

/** Fetch a single payment by ID. Throws on error (caller decides how to handle). */
export async function getPayment(id: string): Promise<Payment> {
  const data = await squareFetch<GetPaymentResponse>(`/payments/${id}`)
  if (!data.payment) throw new Error(`Payment ${id} not found in response`)
  return data.payment
}

/** List all active locations for the account. */
export async function listLocations(): Promise<SquareLocation[]> {
  try {
    const data = await squareFetch<ListLocationsResponse>('/locations')
    return (data.locations ?? []).filter(l => l.status === 'ACTIVE')
  } catch (err) {
    console.warn('[square/api] listLocations failed:', err)
    return []
  }
}

/** Convert Square Money (cents) to a display string e.g. '$25.00' */
export function formatMoney(money: Money): string {
  const dollars = money.amount / 100
  return `$${dollars.toFixed(2)}`
}
