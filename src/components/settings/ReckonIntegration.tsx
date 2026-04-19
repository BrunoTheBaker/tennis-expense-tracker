'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface ReckonStatus {
  configured:      boolean
  connected:       boolean
  authenticatedAt: string | null
}

function ReckonIntegrationInner() {
  const [status,        setStatus]        = useState<ReckonStatus | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [disconnectErr, setDisconnectErr] = useState(false)
  const searchParams = useSearchParams()

  // Re-check status when the treasurer is redirected back after OAuth
  const reckonParam = searchParams.get('reckon')

  useEffect(() => {
    setLoading(true)
    fetch('/api/reckon/status')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ReckonStatus>
      })
      .then(d  => { setStatus(d); setLoading(false) })
      .catch(() => { setStatus({ configured: false, connected: false, authenticatedAt: null }); setLoading(false) })
  }, [reckonParam])

  async function handleDisconnect() {
    setDisconnectErr(false)
    try {
      const res = await fetch('/api/reckon/disconnect', { method: 'POST' })
      if (!res.ok) { setDisconnectErr(true); return }
      setStatus(prev => prev ? { ...prev, connected: false, authenticatedAt: null } : null)
    } catch {
      setDisconnectErr(true)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <span className="text-sm" style={{ color: 'var(--text-3)' }}>Checking Reckon status…</span>
      </div>
    )
  }

  if (!status?.configured) {
    return (
      <div className="card opacity-60">
        <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          Credentials not configured. Set RECKON_CLIENT_ID, RECKON_CLIENT_SECRET,
          RECKON_SUBSCRIPTION_KEY, RECKON_BOOK_ID, and RECKON_REDIRECT_URI in Vercel.
        </p>
      </div>
    )
  }

  if (!status.connected) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '10px', color: '#dc2626' }}>⏺</span>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>Not connected</span>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
          Connect your Reckon One book to post transactions directly.
        </p>
        {reckonParam === 'error' && (
          <p className="text-sm mb-4" style={{ color: '#dc2626' }}>
            Connection failed. Please try again.
          </p>
        )}
        <a href="/api/reckon/auth" className="btn-primary inline-block">
          Connect to Reckon One →
        </a>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: '10px', color: '#15803d' }}>⏺</span>
        <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
        <span className="text-xs" style={{ color: '#15803d' }}>Connected</span>
      </div>
      <table className="w-full text-sm mb-4">
        <tbody>
          <tr>
            <td className="py-1 pr-6 section-label">Book</td>
            <td style={{ color: 'var(--text-1)' }}>Safety Bay Tennis Club</td>
          </tr>
          {status.authenticatedAt && (
            <tr>
              <td className="py-1 pr-6 section-label">Authorised</td>
              <td style={{ color: 'var(--text-2)' }}>
                {new Date(status.authenticatedAt).toLocaleString('en-AU', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {disconnectErr && (
        <p className="text-sm mb-2" style={{ color: '#dc2626' }}>
          Disconnect failed. Please try again.
        </p>
      )}
      <button onClick={handleDisconnect} className="btn-secondary text-sm">
        Disconnect
      </button>
    </div>
  )
}

export default function ReckonIntegration() {
  return (
    <Suspense fallback={
      <div className="card">
        <span className="text-sm" style={{ color: 'var(--text-3)' }}>Loading…</span>
      </div>
    }>
      <ReckonIntegrationInner />
    </Suspense>
  )
}
