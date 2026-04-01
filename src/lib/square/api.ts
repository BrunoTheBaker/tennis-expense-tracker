import { squareFetch } from './client'
import type {
  Payment, Money,
  ListPaymentsResponse, GetPaymentResponse,
  SquareLocation, ListLocationsResponse,
  Order, SearchOrdersResponse,
} from './types'

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

/**
 * Search all COMPLETED orders in a date range, auto-paginating.
 * Returns one Order per transaction — use line_items[] for item detail.
 * Always filters to SQUARE_LOCATION_ID unless locationId is explicitly passed.
 */
export async function searchOrders(
  from: string,
  to: string,
  locationId?: string
): Promise<Order[]> {
  const location = locationId ?? process.env.SQUARE_LOCATION_ID
  if (!location) {
    console.warn('[square/api] searchOrders: no location ID configured')
    return []
  }

  const results: Order[] = []
  let cursor: string | undefined

  try {
    do {
      const body: Record<string, unknown> = {
        location_ids: [location],
        query: {
          filter: {
            date_time_filter: {
              created_at: { start_at: from, end_at: to },
            },
            state_filter: { states: ['COMPLETED'] },
          },
          sort: { sort_field: 'CREATED_AT', sort_order: 'ASC' },
        },
        limit: 500,
        ...(cursor ? { cursor } : {}),
      }

      const data = await squareFetch<SearchOrdersResponse>('/orders/search', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (data.orders) results.push(...data.orders)
      cursor = data.cursor
    } while (cursor)
  } catch (err) {
    console.warn('[square/api] searchOrders failed:', err)
    return []
  }

  return results
}

/** Convert Square Money (cents) to a display string e.g. '$25.00' */
export function formatMoney(money: Money): string {
  const dollars = money.amount / 100
  return `$${dollars.toFixed(2)}`
}
