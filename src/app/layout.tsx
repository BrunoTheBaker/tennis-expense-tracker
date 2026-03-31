import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import TopNav from '@/components/layout/TopNav'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SBTC Treasury',
  description: 'Financial management for Safety Bay Tennis Club',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <TopNav />
        <main className="max-w-[1240px] mx-auto px-7 py-7">
          {children}
        </main>
      </body>
    </html>
  )
}
