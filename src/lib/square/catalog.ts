/**
 * Catalog cache — server-side only.
 *
 * Fetches all ITEM and CATEGORY objects from Square once per hour and builds
 * a lookup map: variationId → category name.
 *
 * Lookup chain:
 *   order.line_items[].catalog_object_id  (= variation ID)
 *   → item.item_data.reporting_category.id (or categories[0].id)
 *   → category.category_data.name
 */

import { squareFetch } from './client'
import type { CatalogObject, ListCatalogResponse } from './types'

const CACHE_TTL_MS = 60 * 60 * 1000  // 1 hour

let cacheBuiltAt = 0
// Maps variation catalog_object_id → category name (e.g. 'Sunday Social')
const variationToCategoryName = new Map<string, string>()

async function fetchAllCatalogObjects(type: string): Promise<CatalogObject[]> {
  const results: CatalogObject[] = []
  let cursor: string | undefined

  do {
    const params = new URLSearchParams({ types: type, limit: '1000' })
    if (cursor) params.set('cursor', cursor)
    const data = await squareFetch<ListCatalogResponse>(`/catalog/list?${params}`)
    const active = (data.objects ?? []).filter(o => !o.is_deleted)
    results.push(...active)
    cursor = data.cursor
  } while (cursor)

  return results
}

async function buildCache(): Promise<void> {
  const [items, categories] = await Promise.all([
    fetchAllCatalogObjects('ITEM'),
    fetchAllCatalogObjects('CATEGORY'),
  ])

  // categoryId → name
  const categoryNameById = new Map<string, string>()
  for (const cat of categories) {
    if (cat.category_data?.name) {
      categoryNameById.set(cat.id, cat.category_data.name)
    }
  }

  // variationId → categoryName (two-step via item)
  variationToCategoryName.clear()
  for (const item of items) {
    if (!item.item_data) continue
    const categoryId =
      item.item_data.reporting_category?.id ??
      item.item_data.categories?.[0]?.id
    if (!categoryId) continue

    const categoryName = categoryNameById.get(categoryId)
    if (!categoryName) continue

    for (const variation of item.item_data.variations ?? []) {
      variationToCategoryName.set(variation.id, categoryName)
    }
  }

  cacheBuiltAt = Date.now()
}

/** Returns the Square category name for a given variation ID, or undefined if unknown. */
export async function getCategoryName(variationId: string | undefined): Promise<string | undefined> {
  if (!variationId) return undefined

  if (Date.now() - cacheBuiltAt > CACHE_TTL_MS) {
    try {
      await buildCache()
    } catch (err) {
      console.warn('[square/catalog] buildCache failed:', err)
    }
  }

  return variationToCategoryName.get(variationId)
}

/**
 * Pre-warm the cache. Call once at the start of a batch operation
 * to avoid per-item async waits.
 */
export async function ensureCatalogCached(): Promise<void> {
  if (Date.now() - cacheBuiltAt > CACHE_TTL_MS) {
    await buildCache()
  }
}
