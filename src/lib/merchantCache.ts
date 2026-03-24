import type { CategoriseResult } from './server/categoriser'
import { getMerchantKey } from './csvParser'

const CACHE_KEY = 'sbtc_merchant_cache'

type MerchantCache = Record<string, { code: string; name: string }>

export function getCachedSuggestion(description: string): CategoriseResult | null {
  if (typeof window === 'undefined') return null
  try {
    const cache: MerchantCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
    const key = getMerchantKey(description)
    const hit = cache[key]
    if (hit) return { ...hit, confidence: 'high' }
    return null
  } catch {
    return null
  }
}

export function setCachedSuggestion(description: string, code: string, name: string): void {
  if (typeof window === 'undefined') return
  try {
    const cache: MerchantCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
    cache[getMerchantKey(description)] = { code, name }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage unavailable — ignore silently
  }
}
