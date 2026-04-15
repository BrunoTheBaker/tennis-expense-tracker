'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { SessionStatus } from '@/lib/reckon/auth'

async function fetchStatus(): Promise<SessionStatus> {
  const res = await fetch('/api/reckon/session-status')
  if (!res.ok) throw new Error('Failed to fetch session status')
  return res.json()
}

export default function ReckonSessionTimer() {
  const [status, setStatus] = useState<SessionStatus | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await fetchStatus())
    } catch { /* ignore network errors */ }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  if (!status) return null

  if (!status.authenticated) {
    return (
      <div className="flex items-center gap-2 text-xs shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>Reckon</span>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>· Not connected</span>
        <Link
          href="/settings"
          className="underline underline-offset-2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Connect
        </Link>
      </div>
    )
  }

  const warn = status.minutesRemaining != null && status.minutesRemaining <= 2

  if (warn) {
    const mins  = status.minutesRemaining ?? 0
    const label = `${mins}:00`
    return (
      <div className="flex items-center gap-2 text-xs shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>Reckon</span>
        <span style={{ color: 'rgba(255,255,255,0.35)' }}>· Expires in {label}</span>
        <Link
          href="/settings"
          className="underline underline-offset-2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Renew
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs shrink-0">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
      <span style={{ color: 'rgba(255,255,255,0.55)' }}>Reckon</span>
      <span style={{ color: 'rgba(255,255,255,0.35)' }}>· Session active</span>
    </div>
  )
}
