'use client'

import { useState, useEffect } from 'react'

const LS_KEY = 'sbtc_reckon_config'

interface ReckonConfig {
  apiKey: string
  bookId: string
}

function loadConfig(): ReckonConfig {
  if (typeof window === 'undefined') return { apiKey: '', bookId: '' }
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
  } catch { return { apiKey: '', bookId: '' } }
}

export default function ReckonIntegration() {
  const [config, setConfig] = useState<ReckonConfig>({ apiKey: '', bookId: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => { setConfig(loadConfig()) }, [])

  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>Reckon One</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
        API credentials for future direct integration. Not used yet — CSV export is the current workflow.
      </p>
      <div className="space-y-3">
        <div>
          <label className="section-label block mb-1">API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
            placeholder="Enter Reckon API key"
            className="input-field"
          />
        </div>
        <div>
          <label className="section-label block mb-1">Book ID</label>
          <input
            type="text"
            value={config.bookId}
            onChange={e => setConfig(c => ({ ...c, bookId: e.target.value }))}
            placeholder="7f71d29b-8720-422d-8382-d961bb783990"
            className="input-field"
          />
        </div>
        <button onClick={save} className="btn-primary">
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </div>
  )
}