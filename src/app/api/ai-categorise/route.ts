/**
 * POST /api/ai-categorise
 *
 * Accepts: { description: string, amount: number, source?: string }
 * Returns: { suggestions: CostCentreSuggestion[] }
 *
 * Uses Claude to rank cost centres for the given transaction,
 * then enriches the response with CostCentre objects from COST_CENTRES.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { COST_CENTRES, COST_CENTRE_MAP, SQUARE_CATEGORY_MAP } from '@/lib/costCentres'
import { suggestCostCentres, type CostCentreSuggestion } from '@/lib/categoriser'

const client = new Anthropic()

// Build a compact cost-centre list for the prompt (code + label only)
const CC_LIST = COST_CENTRES
  .map(cc => `${cc.ledgerCode} — ${cc.label} [${cc.category}]`)
  .join('\n')

interface AiSuggestion {
  ledgerCode: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

interface RequestBody {
  description: string
  amount: number
  source?: string
  squareCategory?: string
  squareItemName?: string
}

export async function POST(req: NextRequest) {
  let body: RequestBody
  try {
    body = await req.json() as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { description, amount, source, squareCategory, squareItemName } = body
  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }

  // Get keyword suggestions as baseline context for the model
  const keywordSuggestions = suggestCostCentres({
    description, amount, debit: 0, credit: amount,
    date: '', reference: '', status: 'pending',
    squareCategory, squareItemName,
  })
    .map(s => s.costCentre.ledgerCode)
    .join(', ')

  const squareContext = squareCategory
    ? `Square catalog category: "${squareCategory}"${squareItemName ? `, item: "${squareItemName}"` : ''}`
    : 'No Square catalog data available'

  const prompt = `You are an accounting assistant for Safety Bay Tennis Club (SBTC), a community tennis club in Perth, WA.

Classify the following bank transaction to the most appropriate cost centre(s).

Transaction:
  Description: ${description}
  Amount: $${Math.abs(amount).toFixed(2)} (${amount < 0 ? 'debit/expense' : 'credit/income'})
  Source: ${source ?? 'bank'}
  ${squareContext}
  Keyword hints: ${keywordSuggestions || 'none'}

Square category mappings (treat these as ground truth where present):
${Object.entries(SQUARE_CATEGORY_MAP).map(([cat, code]) => `  "${cat}" → ${code}`).join('\n')}

Available cost centres:
${CC_LIST}

Return a JSON array of up to 3 suggestions, ordered by best match first:
[
  { "ledgerCode": "x-xxxx", "confidence": "high|medium|low", "reason": "brief reason" },
  ...
]

Rules:
- Only return codes that exist in the list above.
- If a Square category mapping exists above for this transaction, use it as the top result with confidence "high".
- confidence "high" = very clear match, "medium" = probable, "low" = possible but uncertain.
- Use expense accounts (6-xxxx) for debits, income accounts (4-xxxx) for credits, COGS (5-xxxx) for drink stock purchases.
- Synergy = electricity (6-1203), Pentanet = internet (6-1211), City of Rockingham = rates (6-1210), Jim's Mowing / Barras Mowing = grounds maintenance (6-1403), BWS = drinks stock purchase (5-1000), Fox Tennis Academy / Karen Wenham = coaching lease (4-7004), Stripe payout = court hire (4-0501), interest on term deposit = interest received (4-8001).
- Return ONLY the JSON array, no other text.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    // Parse JSON — strip any markdown fences the model might add
    const jsonStr = text.replace(/```(?:json)?/g, '').trim()
    const aiSuggestions = JSON.parse(jsonStr) as AiSuggestion[]

    const suggestions: CostCentreSuggestion[] = aiSuggestions
      .filter(s => COST_CENTRE_MAP.has(s.ledgerCode))
      .map(s => ({
        costCentre: COST_CENTRE_MAP.get(s.ledgerCode)!,
        score: s.confidence === 'high' ? 0.9 : s.confidence === 'medium' ? 0.6 : 0.4,
        confidence: s.confidence,
        reason: s.reason,
      }))

    return NextResponse.json({ suggestions })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/ai-categorise]', message)
    // Graceful degradation: return keyword suggestions
    const fallback = suggestCostCentres({
      description, amount, debit: 0, credit: amount,
      date: '', reference: '', status: 'pending',
      squareCategory, squareItemName,
    })
    return NextResponse.json({ suggestions: fallback, _fallback: true })
  }
}
