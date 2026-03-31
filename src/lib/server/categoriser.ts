import 'server-only'
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
        content: `You are a bookkeeper for Safety Bay Tennis Club (SBTC), Perth WA.

KNOWN MERCHANT MAPPINGS (use these first before guessing):
- BWS / Big Brews → 5-1000 COGS: Drinks
- Karen Wenham → 6-1201 Cleaning Honorarium
- Shane Fox / Fox Tennis Academy → 6-5005 Coaching Kidsport
- Jims Mowing / Barra's Mowing → 6-1403 Grounds: Repairs & Maintenance
- Elders Insurance → 6-7003 Insurance
- Pentanet → 6-1211 Internet Connection
- Reckon Ltd → 6-7099 Computer Software
- Synergy BPAY → 6-1212 Electricity
- City of Rockingham BPAY → 6-1210 Rates, ESL, Waste
- Tennis West → 6-1602 Pennants: Tennis West Fees
- WA Return Recycle Renew → 4-9000 Other Income
- DEPOSIT ROCKINGHAM CITY / Cash Income → 4-4011 Drink Sales (cash)
- Shane Fox INV (coaching rent) → 4-5001 Coaching Rent Income

SQUARE POS categories map to:
- Drinks → 4-4011 Drink Sales
- Monday Social → 4-0201, Wednesday → 4-0202, Thursday → 4-0203
- Friday → 4-0205, Friday Night → 4-0206, Sunday → 4-0207

Transaction:
- Description: ${description}
- Amount: $${Math.abs(amount).toFixed(2)} (${amount >= 0 ? 'credit/income' : 'debit/expense'})

Chart of accounts:
${accountList}

Reply with ONLY a JSON object (no markdown):
{"code": "6-1402", "name": "Grounds - Consumables", "confidence": "high"}

Confidence: "high" = clear match, "medium" = likely match, "low" = unclear`,
      },
    ],
  })

  const block = message.content[0]
  if (!block || block.type !== 'text') {
    throw new Error('Unexpected response type from AI')
  }
  const text = block.text.trim()
  const parsed = JSON.parse(text) as CategoriseResult
  return parsed
}
