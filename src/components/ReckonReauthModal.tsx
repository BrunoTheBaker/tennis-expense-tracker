'use client'

import { useState } from 'react'
import type { AuthErrorCode } from '@/lib/reckon/ReckonAuthError'

interface Props {
  errorCode: AuthErrorCode
  remainingCount?: number   // transactions not yet posted (paused state)
  totalCount?: number       // total being posted
  onClose: () => void
  onResumeAfterAuth?: () => void  // called after successful re-auth when posting was paused
}

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  NOT_AUTHENTICATED:  'You are not connected to Reckon One.',
  TOKEN_EXPIRED:      'Your Reckon session has expired.',
  INACTIVITY_TIMEOUT: 'Your Reckon session expired after 5 minutes of inactivity.',
}

export default function ReckonReauthModal({
  errorCode,
  remainingCount,
  totalCount,
  onClose,
  onResumeAfterAuth,
}: Props) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const hasPausedWork = remainingCount != null && remainingCount > 0

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
      if (onResumeAfterAuth) {
        onResumeAfterAuth()
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base" style={{ color: 'var(--red)' }}>●</span>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--text-1)' }}>
            Reckon session ended
          </h2>
        </div>

        {/* Error message */}
        <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
          {ERROR_MESSAGES[errorCode]}
        </p>

        {/* Paused work notice */}
        {hasPausedWork ? (
          <div
            className="rounded-lg p-3 mb-4"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-1)' }}>
              Posting paused
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              {remainingCount} of {totalCount} transaction{totalCount !== 1 ? 's' : ''} still to post.
              Your progress has been saved — you can resume after logging in.
            </p>
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
            Any unposted work has been saved. You can continue after logging in.
          </p>
        )}

        {/* Connection error */}
        {error && (
          <p className="text-sm mb-3" style={{ color: 'var(--red)' }}>{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {!hasPausedWork && (
            <button className="btn-secondary" onClick={onClose}>Dismiss</button>
          )}
          <button
            className="btn-primary"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting
              ? 'Connecting…'
              : hasPausedWork
                ? 'Log in and resume →'
                : 'Log in to Reckon again →'}
          </button>
        </div>
      </div>
    </div>
  )
}
