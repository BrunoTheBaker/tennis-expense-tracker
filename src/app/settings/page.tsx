import ReckonIntegration from '@/components/settings/ReckonIntegration'
import SquareIntegration from '@/components/settings/SquareIntegration'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Settings</h1>
      <ReckonIntegration />
      <SquareIntegration />
      <DisabledSection
        title="Stripe"
        description="Stripe API integration coming soon. Use CSV upload on the Allocation tab for now."
      />
      <BankMappings />
    </div>
  )
}

function DisabledSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="card opacity-60">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>{title}</h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
        >
          Coming soon
        </span>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>{description}</p>
    </div>
  )
}

const BANK_ACCOUNTS = [
  { name: 'Bank - Trading Account',            defaultCode: '1-1001' },
  { name: 'Bank - Cards Petty Cash Account',   defaultCode: '1-1002' },
  { name: 'Bank - Asset Renewal Account',      defaultCode: '1-1003' },
  { name: 'Bank - Asset Renewal Term Deposit', defaultCode: '1-1004' },
]

function BankMappings() {
  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>Bank Account Mappings</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
        Map each bank account to its Reckon account code. Saved to browser localStorage.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left pb-2 section-label">Account</th>
            <th className="text-left pb-2 section-label">Reckon Code</th>
          </tr>
        </thead>
        <tbody>
          {BANK_ACCOUNTS.map(acct => (
            <tr key={acct.name} className="border-t" style={{ borderColor: 'var(--border)' }}>
              <td className="py-2 pr-4" style={{ color: 'var(--text-2)' }}>{acct.name}</td>
              <td className="py-2">
                <input
                  type="text"
                  defaultValue={acct.defaultCode}
                  className="input-field"
                  style={{ width: '120px' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
        Note: Bank mapping persistence via localStorage will be added in a follow-up.
      </p>
    </div>
  )
}