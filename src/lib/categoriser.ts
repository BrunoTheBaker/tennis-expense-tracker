/**
 * Client-compatible categoriser.
 *
 * suggestCostCentres()  — pure keyword scorer, runs in browser or server
 * aiSuggestCostCentres() — calls /api/ai-categorise (server proxy to Anthropic)
 *
 * Both return CostCentreSuggestion[] ordered by score descending, max 3 results.
 */

import { COST_CENTRES, SQUARE_CATEGORY_MAP, COST_CENTRE_MAP, type CostCentre } from './costCentres'
import type { Transaction } from './financialData'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CostCentreSuggestion {
  costCentre: CostCentre
  score: number               // 0–1
  confidence: 'high' | 'medium' | 'low'
  reason?: string             // only present on AI suggestions
}

// ─── Keyword scorer ───────────────────────────────────────────────────────────

const MIN_SCORE = 0.35
const MAX_SUGGESTIONS = 3

/**
 * Score a single cost centre against a description.
 * Returns a value in [0, 1]:
 *   - each matched keyword adds (1 / totalKeywords) capped at 1
 *   - partial word-boundary matches score at half weight
 */
function scoreCostCentre(cc: CostCentre, desc: string): number {
  if (cc.keywords.length === 0) return 0
  const lower = desc.toLowerCase()
  let hits = 0

  for (const kw of cc.keywords) {
    if (lower.includes(kw)) {
      hits += 1
    }
  }

  return hits / cc.keywords.length
}

/**
 * Pure cost centre suggestions. Scoring priority:
 * 1. squareCategory exact match in SQUARE_CATEGORY_MAP → score 0.95
 * 2. description keyword scoring (existing logic) → score 0–1
 * Returns up to MAX_SUGGESTIONS entries with score ≥ MIN_SCORE, ordered by score.
 */
export function suggestCostCentres(transaction: Transaction): CostCentreSuggestion[] {
  const { description, squareCategory } = transaction

  // Priority 1: Square category exact map lookup
  if (squareCategory) {
    const ledgerCode = SQUARE_CATEGORY_MAP[squareCategory]
    if (ledgerCode) {
      const cc = COST_CENTRE_MAP.get(ledgerCode)
      if (cc) {
        return [{
          costCentre: cc,
          score: 0.95,
          confidence: 'high',
          reason: 'Auto-matched via Square',
        }]
      }
    }
  }

  // Priority 2: description keyword scoring (fallback)
  if (!description.trim()) return []

  const scored = COST_CENTRES
    .map(cc => ({ cc, score: scoreCostCentre(cc, description) }))
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)

  return scored.map(({ cc, score }) => ({
    costCentre: cc,
    score,
    confidence: score >= 0.7 ? 'high' : score >= 0.45 ? 'medium' : 'low',
  }))
}

// ─── AI suggestions (via route handler) ──────────────────────────────────────

interface AiCategoriseRequest {
  description: string
  amount: number
  source?: string
  squareCategory?: string
  squareItemName?: string
}

/**
 * Calls /api/ai-categorise and returns AI-ranked suggestions.
 * Falls back to keyword suggestions if the request fails.
 */
export async function aiSuggestCostCentres(
  transaction: Transaction
): Promise<CostCentreSuggestion[]> {
  // If squareCategory maps directly to a resolvable cost centre, skip the AI call
  if (transaction.squareCategory) {
    const ledgerCode = SQUARE_CATEGORY_MAP[transaction.squareCategory]
    if (ledgerCode && COST_CENTRE_MAP.get(ledgerCode)) {
      return suggestCostCentres(transaction)
    }
  }

  const req: AiCategoriseRequest = {
    description:    transaction.description,
    amount:         transaction.amount,
    source:         transaction.source,
    squareCategory: transaction.squareCategory,
    squareItemName: transaction.squareItemName,
  }

  try {
    const res = await fetch('/api/ai-categorise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })

    if (!res.ok) {
      console.warn('[aiSuggestCostCentres] API error', res.status)
      return suggestCostCentres(transaction)
    }

    const data = await res.json() as { suggestions: CostCentreSuggestion[] }
    return data.suggestions ?? []
  } catch (err) {
    console.warn('[aiSuggestCostCentres] fetch failed, falling back to keyword scorer', err)
    return suggestCostCentres(transaction)
  }
}
