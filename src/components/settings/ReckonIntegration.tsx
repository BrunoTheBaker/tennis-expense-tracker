'use client'

import { useState, useEffect } from 'react'
import type { SessionStatus } from '@/lib/reckon/auth'

async function fetchStatus(): Promise<SessionStatus> {
  const res = await fetch('/api/reckon/session-status')
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

export default function ReckonIntegration() {
  const [status, setStatus]         = useState<SessionStatus | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function refresh() {
    try {
      setStatus(await fetchStatus())
    } catch { /* ignore */ }
  }

  useEffect(() => { refresh() }, [])

  async function handleConnect() {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/reckon/auth', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Connection failed')
        return
      }
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    await fetch('/api/reckon/auth', { method: 'DELETE' })
    await refresh()
  }

  const connected = status?.authenticated === true

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Direct API integration for posting transactions.
          </p>
        </div>
        {/* Status dot */}
        {status && (
          <span
            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
            style={{ background: connected ? 'var(--green)' : 'var(--text-3)' }}
          />
        )}
      </div>

      {connected && status ? (
        <>
          {/* Connected state */}
          <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--bg)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Connected</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Session expires after 5 min inactivity
              </p>
              {status.minutesRemaining != null && (
                <p className="text-xs" style={{ color: status.minutesRemaining <= 2 ? '#f59e0b' : 'var(--text-3)' }}>
                  {status.minutesRemaining <= 2
                    ? `⚠ ${status.minutesRemaining} minute${status.minutesRemaining !== 1 ? 's' : ''} remaining`
                    : `${status.minutesRemaining} minutes remaining`}
                </p>
              )}
              {status.minutesSinceActivity != null && (
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  Last activity: {status.minutesSinceActivity === 0 ? 'just now' : `${status.minutesSinceActivity} min ago`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              You will need to log in to Reckon each session.
            </p>
            <button className="btn-secondary text-sm" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Disconnected state */}
          <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--bg)' }}>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Not connected</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              Connect to post transactions directly to Reckon One.
              You will need to log in each session — no credentials are stored.
            </p>
          </div>

          {error && (
            <p className="text-sm mb-3" style={{ color: 'var(--red)' }}>{error}</p>
          )}

          <button
            className="btn-primary"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Connecting…' : 'Connect to Reckon One'}
          </button>
        </>
      )}
    </div>
  )
}
