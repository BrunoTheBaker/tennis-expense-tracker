import type { FinancialPeriod } from '@/lib/financialData'

interface Props {
  period: FinancialPeriod
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n)
}

// Map balance sheet account names to display config
const OPERATING = [
  'Bank - Trading Account',
  'Bank - Cards Petty Cash',
]
const SAVINGS = [
  'Bank - Asset Renewal Account',
  'Bank - Building Fund',
  'Bank - Asset Renewal Term Deposit',
  'Building Fundraiser Term Deposit',
]

function BankRow({ name, amount }: { name: string; amount: number }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{name}</span>
      <span className="font-mono font-medium" style={{ color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
        {fmt(amount)}
      </span>
    </div>
  )
}

export default function BankBalances({ period }: Props) {
  const bs = period.balanceSheet

  function getAmount(name: string) {
    return bs.find(l => l.name === name)?.amount ?? 0
  }

  const operatingTotal = OPERATING.reduce((s, n) => s + getAmount(n), 0)
  const savingsTotal   = SAVINGS.reduce((s, n) => s + getAmount(n), 0)

  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-4" style={{ color: 'var(--text-1)' }}>Bank Balances</h2>

      <div className="mb-4">
        <p className="section-label mb-1">Operating</p>
        {OPERATING.map(name => <BankRow key={name} name={name.replace('Bank - ', '')} amount={getAmount(name)} />)}
        <div className="flex justify-between pt-2">
          <span className="section-label">Total Operating</span>
          <span className="font-mono font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(operatingTotal)}</span>
        </div>
      </div>

      <div>
        <p className="section-label mb-1">Savings &amp; Investments</p>
        {SAVINGS.map(name => <BankRow key={name} name={name.replace('Bank - ', '')} amount={getAmount(name)} />)}
        <div className="flex justify-between pt-2">
          <span className="section-label">Total Savings</span>
          <span className="font-mono font-semibold text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(savingsTotal)}</span>
        </div>
      </div>
    </div>
  )
}
