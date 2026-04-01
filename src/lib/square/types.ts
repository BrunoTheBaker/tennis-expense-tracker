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
