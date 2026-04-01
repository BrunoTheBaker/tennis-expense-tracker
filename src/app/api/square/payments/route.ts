import { NextRequest, NextResponse } from 'next/server'
import { searchOrders } from '@/lib/square/api'
import { squareLineItemToTransaction } from '@/lib/square/transforms'
import { ensureCatalogCached, getCategoryName } from '@/lib/square/catalog'

const FY_START = '2025-03-01T00:00:00Z'

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams
  const from = search.get('from') ?? FY_START
  const to   = search.get('to')   ?? new Date().toISOString()

  try {
    // Pre-warm catalog cache once so category lookups are instant
    await ensureCatalogCached()

    const orders = await searchOrders(from, to)

    // Expand each order into one Transaction per line item with category names
    const transactions = await Promise.all(
      orders.flatMap(order =>
        (order.line_items ?? [])
          .filter(li => li.item_type === 'ITEM')
          .map(async li => {
            const categoryName = await getCategoryName(li.catalog_object_id)
            return squareLineItemToTransaction(li, order, categoryName)
          })
      )
    )

    return NextResponse.json(transactions)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/square/payments]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
