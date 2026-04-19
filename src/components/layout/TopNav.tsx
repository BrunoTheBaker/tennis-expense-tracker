'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'

const TABS = [
  { label: 'Dashboard',  href: '/' },
  { label: 'Allocation', href: '/transactions' },
  { label: 'Settings',   href: '/settings' },
]

export default function TopNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center h-14 px-6 gap-2"
      style={{ background: 'var(--nav)' }}
    >
      {/* Logo */}
      <span className="text-white font-bold text-base mr-6 shrink-0">
        SBTC Treasury
      </span>

      {/* Tabs */}
      <div className="flex gap-1 flex-1">
        {TABS.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-1.5 rounded text-sm font-medium transition-colors"
            style={
              isActive(tab.href)
                ? { background: 'var(--brand)', color: 'white' }
                : { color: 'rgba(255,255,255,0.7)' }
            }
            onMouseEnter={e => {
              if (!isActive(tab.href)) {
                (e.currentTarget as HTMLElement).style.color = 'white'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive(tab.href)) {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Settings icon */}
      <Link
        href="/settings"
        className="text-white/60 hover:text-white transition-colors"
        aria-label="Settings"
      >
        <Settings size={18} />
      </Link>
    </nav>
  )
}
