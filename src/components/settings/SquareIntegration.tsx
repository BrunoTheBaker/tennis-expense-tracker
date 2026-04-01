'use client'

import { useState } from 'react'
import type { SquareLocation } from '@/lib/square/types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function SquareIntegration() {
  const [status, setStatus] = useState<Status>('idle')
  const [location, setLocation] = useState<SquareLocation | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function testConnection() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/square/locations')
      const data = await res.json() as { locations?: SquareLocation[]; error?: string }
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? `Error ${res.status}`)
        setStatus('error')
        return
      }
      const first = (data.locations ?? [])[0] ?? null
      setLocation(first)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error')
      setStatus('error')
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-1)' }}>
            Square POS
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Read-only access to payment history for treasurer reporting.
          </p>
        </div>
        <button
          onClick={testConnection}
          disabled={status === 'loading'}
          className="btn-secondary text-sm disabled:opacity-50"
        >
          {status === 'loading' ? 'Testing…' : 'Test connection'}
        </button>
      </div>

      {status === 'success' && location && (
        <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2"
          style={{ background: 'rgba(21,128,61,0.08)', color: '#15803d' }}>
          <span className="font-bold">✓</span>
          <span>Connected — <strong>{location.name}</strong> ({location.id})</span>
        </div>
      )}

      {status === 'success' && !location && (
        <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2"
          style={{ background: 'rgba(21,128,61,0.08)', color: '#15803d' }}>
          <span className="font-bold">✓</span>
          <span>Connected — no locations returned</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
          <span className="font-bold">✗</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-3)' }}>
        {location
          ? <span>Location ID: <code className="font-mono">{location.id}</code></span>
          : <span>Run the connection test to verify credentials.</span>
        }
      </div>
    </div>
  )
}
