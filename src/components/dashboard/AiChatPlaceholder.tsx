'use client'

import { useState } from 'react'

const PROMPTS = [
  'What was our biggest expense this month?',
  'How do drink sales compare to last month?',
  'What is our current net position?',
  'Which cost centres are over budget?',
]

export default function AiChatPlaceholder() {
  const [input, setInput] = useState('')

  return (
    <div className="card">
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-1)' }}>AI Assistant</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>
        Ask questions about your finances — coming soon.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a question…"
          className="input-field flex-1"
          disabled
        />
        <button className="btn-primary opacity-50 cursor-not-allowed" disabled>Ask</button>
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
        AI chat will be wired to Claude API in a future update.
      </p>
    </div>
  )
}
