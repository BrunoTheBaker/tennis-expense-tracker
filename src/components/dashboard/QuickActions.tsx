import Link from 'next/link'

export default function QuickActions() {
  return (
    <div className="card flex gap-3 items-center">
      <span className="section-label mr-2">Quick Actions</span>
      <Link href="/transactions" className="btn-primary">
        Go to Allocation →
      </Link>
      <Link href="/reports" className="btn-secondary">
        View Reports →
      </Link>
    </div>
  )
}
