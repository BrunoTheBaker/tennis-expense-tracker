export interface Money {
  amount: number    // in cents
  currency: string
}

export interface CardDetails {
  status: string
  card: {
    brand: string
    last_4: string
  }
}

export interface Payment {
  id: string
  amount_money: Money
  status: string        // 'COMPLETED' | 'FAILED' | 'CANCELED' | 'APPROVED'
  created_at: string    // ISO 8601
  location_id: string
  note?: string
  buyer_email_address?: string
  card_details?: CardDetails
  source_type: string   // 'CARD' | 'CASH' | 'EXTERNAL' | etc.
}

export interface ListPaymentsResponse {
  payments?: Payment[]
  cursor?: string
  errors?: SquareApiErrorItem[]
}

export interface SquareLocation {
  id: string
  name: string
  status: string
  country: string
}

export interface ListLocationsResponse {
  locations?: SquareLocation[]
  errors?: SquareApiErrorItem[]
}

export interface GetPaymentResponse {
  payment?: Payment
  errors?: SquareApiErrorItem[]
}

export interface SquareApiErrorItem {
  category: string
  code: string
  detail: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderLineItem {
  uid: string
  catalog_object_id?: string  // variation ID — use for catalog lookup
  name: string
  quantity: string
  variation_name?: string
  base_price_money: Money     // product price ex-surcharge (use for accounting)
  gross_sales_money?: Money   // inc. surcharge
  total_money: Money
  total_discount_money?: Money
  item_type: string           // 'ITEM' | 'CUSTOM_AMOUNT'
}

export interface Order {
  id: string
  location_id: string
  line_items?: OrderLineItem[]
  created_at: string
  updated_at: string
  state: string
  total_money: Money
}

export interface SearchOrdersResponse {
  orders?: Order[]
  cursor?: string
  errors?: SquareApiErrorItem[]
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface CatalogObject {
  type: string        // 'ITEM' | 'CATEGORY' | 'ITEM_VARIATION' | ...
  id: string
  is_deleted?: boolean
  item_data?: {
    name: string
    variations?: CatalogObject[]
    categories?: Array<{ id: string }>
    reporting_category?: { id: string }
  }
  item_variation_data?: {
    item_id: string
    name: string
  }
  category_data?: {
    name: string
  }
}

export interface ListCatalogResponse {
  objects?: CatalogObject[]
  cursor?: string
  errors?: SquareApiErrorItem[]
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class SquareApiError extends Error {
  status: number
  errors: SquareApiErrorItem[]
  constructor(status: number, errors: SquareApiErrorItem[]) {
    super(`Square API error ${status}: ${errors.map(e => e.detail).join(', ')}`)
    this.name = 'SquareApiError'
    this.status = status
    this.errors = errors
  }
}
