# SBTC Treasury — Project Context

## Overview
Safety Bay Tennis Club (SBTC), Safety Bay, Perth WA. This is the Treasurer's working directory for financial management, reconciliation, and app development.

## Financial Year
FY 2025-26 = 1 March 2025 to 28 February 2026.

## Systems
- **Reckon One** (cloud accounting): https://app.reckonone.com/7f71d29b-8720-422d-8382-d961bb783990/Core
- **Square POS**: Drinks, social tennis, events, tournaments — item-level CSV exports
- **Stripe**: Court hire bookings, membership payments
- **4 bank accounts**: Trading Account (ANZ), Cards Petty Cash Account (ANZ), Asset Renewal Account, Asset Renewal Term Deposit / Building Fund

## Chart of Accounts Mapping
Square POS categories map to Reckon accounts:
- Drinks/Canteen → 4-4011
- Social Tennis by day → 4-0201 (Mon), 4-0202 (Wed), 4-0203 (Thu), 4-0205 (Fri), 4-0206 (Fri Night), 4-0207 (Sun)
- Memberships → 4-0101 to 4-0105
- Events → 4-6000 to 4-6020
- Tournaments → 4-0401, 4-0402
- Pennants → 4-0301, 4-0302

Full chart of accounts extracted to: `FY 2025-26/FY 2025-26 Master Chart of Accounts.xlsx`

## Allocation Rules
Comprehensive rules documented in: `FY 2025-26/Allocation Rules Database.md`

## Key FY 2025-26 Findings

### P&L Summary
- Total Income: $111,889.21
- Total COGS: $5,450.37 (Drinks $5,324.89 + Uniforms $125.48)
- Total Expenses: $68,243.72
- Net Position: $38,195.12 (+144.7% YoY)

### Cash Deposits
10 cash deposits totaling $4,050.50 for FY 2025-26. These are lump sums deposited at Rockingham City branch containing a mix of social tennis fees + drink sales collected in cash.
- Cash deposits fully explain the $3,550 gap between Square POS social tennis ($5,745) and Reckon social tennis ($9,295)
- Cash drink sales are NOT being allocated to 4-4011 — they appear to be lumped into social tennis codes

### Drinks Discrepancy (UNRESOLVED)
- Drinks POS Report (annual accounts): $9,776.45
- Reckon P&L account 4-4011: $8,577.95
- Gap: $1,198.50
- COGS matches exactly ($5,324.89) — only the sales side disagrees
- Root cause: cash drink sales coded to social tennis instead of 4-4011
- This means social tennis income is overstated and drink sales understated by ~$1,200

### Square POS Totals (full year)
- Total Square POS: $20,570.43 (2,952 transactions)
- Drinks via Square: $9,929.19
- Social tennis via Square: $5,745.14

## Validation
After building any analysis spreadsheet, run the validator:
```
cd "FY 2025-26" && python3 validate_analysis.py "YourFile.xlsx"
```
This compares all account codes and amounts against the master chart of accounts.

## Key Files (FY 2025-26/)
- `FY 2025-26 Annual Analysis.xlsx` — 5-sheet comprehensive analysis (Income, Cash Recon, Drinks P&L, Expenses, Key Findings)
- `FY 2025-26 P&L vs Our Analysis.xlsx` — Line-by-line comparison of our figures vs annual accounts
- `FY 2025-26 Master Chart of Accounts.xlsx` — All 82 account codes extracted from P&L
- `validate_analysis.py` — Validation script
- `Allocation Rules Database.md` — How to allocate Square/Stripe/bank transactions
- `Drinks PnL/FY 2025-26 Square POS vs Reckon Analysis.xlsx` — Square POS vs Reckon with corrected cash reconciliation
- `Monthly/` — Monthly reports and source PDFs

## Pending Tasks
1. Allocate 8 confident Petty Cash transactions in Reckon
2. Get input on 6 uncertain Petty Cash transactions
3. Cross-reference Stripe dashboard for payout breakdowns (blocked — can't log into Stripe yet)
4. Refresh Petty Cash bank feed (currently only to 15 Mar)
5. Check Asset Renewal & Building Fund for interest entries
6. Reconcile all 4 bank accounts for March 2026
7. Generate 7 monthly reports for March
8. Prep books for auditor (3 weeks before AGM)
9. Winter pennant invoices — get names from Club Captain
10. Coach fee table for upcoming year
