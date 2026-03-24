'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Home,
  Plus,
  BarChart3,
  FileText,
  Users,
  Settings,
} from 'lucide-react'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Add Expense', href: '/expenses/new', icon: Plus },
  { name: 'Expenses', href: '/expenses', icon: BarChart3 },
  { name: 'Budget Tracking', href: '/budget', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Image src="/sbtc_logo.png" alt="Safety Bay Tennis Club" width={40} height={40} className="object-contain" />
        <span className="ml-2 text-base font-semibold text-gray-900">
          Safety Bay TC
        </span>
      </div>
      
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                    isActive
                      ? 'bg-tennis-green-50 text-tennis-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}