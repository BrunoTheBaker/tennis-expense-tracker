# SBTC Treasury App — Planning

## Terminology

| Term | Meaning |
|------|---------|
| **Allocation / coding** | Assigning a cost centre (Reckon account code) to a transaction. This is what this app does. |
| **Bank reconciliation** | Matching bank statement transactions against the accounting system. This happens inside Reckon One — out of scope for this app. |
| **Posted** | A transaction that has been sent to Reckon One via the API. |
| **Unallocated** | A transaction with no cost centre assigned yet. |

> **Note on naming:** Earlier versions of this app used the word "reconcile" for the allocation step. This was incorrect — reconciliation in accounting means matching bank statements to the ledger, which Reckon One handles. The correct terms are *allocate* (assign a cost centre) and *post* (send to Reckon One).

---

## Architecture

Next.js 14 App Router · TypeScript · Tailwind CSS · Vitest

### Key directories

```
src/
  app/
    transactions/page.tsx     # Allocation page (upload → review → post)
    api/reckon/
      post-transactions/      # POST /api/reckon/post-transactions
  components/
    allocation/               # AllocationGate, CostCentrePicker
    ReckonPostModal.tsx        # 3-screen post + progress modal
    RetryQueuePanel.tsx        # Retry queue table + banner
  lib/
    reckon/
      auth.ts                 # OAuth2 client credentials, typed HTTP client
      api.ts                  # Read-only Reckon API wrappers
      write.ts                # Server-only write layer (postTransaction*)
      accountCache.ts         # 60-min server-side account cache
      mock.ts                 # Static mock data for dev/test
    csvParser.ts              # Reckon/Square/Stripe CSV parsers + serialiser
    costCentres.ts            # CostCentre definitions with keyword lists
    accounts.ts               # Flat chart of accounts
    financialData.ts          # Transaction type + financial period data
```

---

## Allocation workflow

```
Upload CSV
  → parse (Reckon / Square / Stripe)
  → review in sectioned table:
      Green section  — Allocated (confirmed, ready to post)
      Amber section  — Not yet allocated (pending, needs cost centre)
      Grey section   — Skipped
      Grey (dimmed)  — Posted (postedToReckon === true)
  → AllocationGate — enabled as soon as ≥1 transaction is allocated
      button shows count: "Post N →"
      pending transactions do NOT block posting
    → ReckonPostModal — Summary screen
        shows: transaction count, total value, period,
               two-bucket display (ready to post vs unallocated),
               breakdown by source + top 5 cost centres
    → Treasurer confirms → Posting screen
        sequential post (one-at-a-time, never parallel)
        live progress bar + last 3 completed transactions
    → POST to Reckon One (sequential, skip on failure)
    → CSV downloaded as backup (automatic, always)
    → Results screen
        success count + total
        failed count → retry queue stored in sessionStorage
    → "Posted ✓" badge applied to successful transactions in table
    → Unallocated transactions remain in amber section
    → Failed transactions → RetryQueuePanel (sessionStorage)
```

### Safety rules (enforced in write.ts)

| Rule | Where enforced |
|------|---------------|
| NEVER post `source === 'reckon'` | `postTransaction()` guard |
| NEVER post `postedToReckon === true` | `postTransaction()` guard |
| NEVER post non-split with no `accountCode` | `postTransaction()` guard |
| CSV always generated as backup | `ReckonPostModal` results screen |
| Sequential only — no `Promise.all` | `postTransactionBatch()` |
| Log every PostResult | `log()` helper in write.ts |

### Retry queue

- Stored in `sessionStorage` under key `sbtc_retry_queue_{period}`
- Persists across page navigation within the same browser tab
- `RetryQueueBanner` reads queue on mount, shows count if non-empty
- `RetryQueuePanel` shows table with Retry + Edit cost centre per row
- `retryFailed()` clears `postedToReckon` flag before re-attempting

---

## Security

| Behaviour | Implementation |
|-----------|---------------|
| Explicit connect required each session | `connectWithCredentials()` — not called automatically |
| No refresh tokens | Access token only; refresh token discarded after OAuth exchange |
| Tokens in memory only | No file, cookie, or localStorage storage |
| 5-minute inactivity timeout | `isInactive()` check in `getAccessToken()` |
| Active use extends session | `lastActivity` updated on every `getAccessToken()` call |
| Mid-post interruption handled | `ReckonPostModal` pauses loop on 401, saves remaining to sessionStorage, resumes after re-auth |
| Session timer in nav | `ReckonSessionTimer` polls `/api/reckon/session-status` every 30 s |

---

## Reckon One API

| Credential | Env var |
|-----------|---------|
| OAuth client ID | `RECKON_CLIENT_ID` |
| OAuth client secret | `RECKON_CLIENT_SECRET` |
| Book ID | `RECKON_BOOK_ID` |
| APIM subscription key | `RECKON_SUBSCRIPTION_KEY` |

Base URL: `https://api.reckonone.com/v2`

Write endpoint: `POST /books/{bookId}/transactions`

Request body:
```json
{
  "transactionDate": "2025-03-15",
  "description":     "Sunday Social – Day Fee",
  "reference":       "SQ-{reference}",
  "amount":          4.00,
  "accountId":       "{reckonAccountId}",
  "type":            "credit"
}
```

Account ID resolution: `accountCode` (e.g. `"4-0207"`) → `Account.id` via chart of accounts cache (`getAccountsWithCache()`).

---

## Testing

Run: `npm test` (vitest)

Key test file: `src/lib/reckon/__tests__/write.test.ts`
- Continues after single failure
- Skips `source === 'reckon'` transactions
- Skips `postedToReckon === true` (duplicate guard)
- Correct error message on API failure
- Split transaction: one post per split with suffixed reference
- Graceful failure when no matching account for cost centre
- `retryFailed()` clears duplicate guard for re-attempt
