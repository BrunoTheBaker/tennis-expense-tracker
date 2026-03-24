import Anthropic from '@anthropic-ai/sdk'
import { accounts } from '@/lib/accounts'

// ⚠️ SERVER-ONLY — never import this file from a client component.
// Called exclusively from /api/categorise/route.ts

const client = new Anthropic()

export interface CategoriseResult {
  code: string
  name: string
  confidence: 'high' | 'medium' | 'low'
}

const accountList = accounts
  .map(a => `${a.code} ${a.name} (${a.type})`)
  .join('\n')

export async function suggestCostCentre(
  description: string,
  amount: number
): Promise<CategoriseResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `You are a bookkeeper for Safety Bay Tennis Club. Given a bank transaction, suggest the most appropriate cost centre from the chart of accounts below.

Transaction:
- Description: ${description}
- Amount: $${Math.abs(amount).toFixed(2)} (${amount >= 0 ? 'credit/income' : 'debit/expense'})

Chart of accounts:
${accountList}

Reply with ONLY a JSON object in this exact format (no markdown, no explanation):
{"code": "6-1402", "name": "Grounds - Consumables", "confidence": "high"}

Confidence rules:
- "high": description clearly matches one account
- "medium": reasonable match but could be another
- "low": unclear or ambiguous`,
      },
    ],
  })

  const text = (message.content[0] as { type: string; text: string }).text.trim()
  const parsed = JSON.parse(text) as CategoriseResult
  return parsed
}
