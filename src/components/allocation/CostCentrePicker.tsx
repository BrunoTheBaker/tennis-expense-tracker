'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  aiSuggestCostCentres,
  type CostCentreSuggestion,
} from '@/lib/categoriser'

import type { Transaction } from '@/lib/financialData'
import { COST_CENTRES, SQUARE_CATEGORY_MAP, COST_CENTRE_MAP, type CostCentre } from '@/lib/costCentres'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  transaction: Transaction          // full transaction (replaces individual string props)
  currentCode?: string
  onSelect: (code: string, label: string) => void
  disabled?: boolean
}

// ─── Confidence badge styling ─────────────────────────────────────────────────

const CONFIDENCE_CLASSES: Record<CostCentreSuggestion['confidence'], string> = {
  high:   'text-green-700  bg-green-50  border-green-200',
  medium: 'text-amber-700  bg-amber-50  border-amber-200',
  low:    'text-slate-600  bg-slate-100 border-slate-200',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Group an array of cost centres by their category field. */
function groupByCategory(items: CostCentre[]): [string, CostCentre[]][] {
  const map = new Map<string, CostCentre[]>()
  for (const cc of items) {
    const existing = map.get(cc.category)
    if (existing) {
      existing.push(cc)
    } else {
      map.set(cc.category, [cc])
    }
  }
  return Array.from(map.entries())
}

/** Case-insensitive filter across label, ledgerCode, and category. */
function filterCostCentres(query: string): CostCentre[] {
  if (!query.trim()) return COST_CENTRES
  const q = query.toLowerCase()
  return COST_CENTRES.filter(
    cc =>
      cc.label.toLowerCase().includes(q) ||
      cc.ledgerCode.toLowerCase().includes(q) ||
      cc.category.toLowerCase().includes(q),
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CostCentrePicker({
  transaction,
  currentCode,
  onSelect,
  disabled = false,
}: Props) {
  const [suggestions, setSuggestions]   = useState<CostCentreSuggestion[]>([])
  const [loading, setLoading]           = useState(false)
  const [selectedCode, setSelectedCode] = useState<string | undefined>(currentCode)

  // Dropdown state
  const [searchQuery, setSearchQuery]   = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const listRef      = useRef<HTMLUListElement>(null)

  // ── Sync currentCode prop → local state ─────────────────────────────────────
  useEffect(() => {
    setSelectedCode(currentCode)
  }, [currentCode])

  // ── Fetch AI suggestions on description change ───────────────────────────────
  useEffect(() => {
    if (!transaction.description) return

    let cancelled = false
    setLoading(true)

    aiSuggestCostCentres(transaction)
      .then(results => {
        if (!cancelled) setSuggestions(results)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [transaction.description, transaction.amount, transaction.source,
      transaction.squareCategory, transaction.squareItemName])

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Scroll highlighted item into view ───────────────────────────────────────
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[highlightIdx] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [highlightIdx])

  // ── Filtered + grouped results for dropdown ──────────────────────────────────
  const filteredFlat   = filterCostCentres(searchQuery)
  const groupedOptions = groupByCategory(filteredFlat)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (code: string, label: string) => {
      setSelectedCode(code)
      setDropdownOpen(false)
      setSearchQuery('')
      setHighlightIdx(0)
      onSelect(code, label)
    },
    [onSelect],
  )

  function handlePillClick(suggestion: CostCentreSuggestion) {
    handleSelect(suggestion.costCentre.ledgerCode, suggestion.costCentre.label)
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setDropdownOpen(true)
        setHighlightIdx(0)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx(i => Math.min(i + 1, filteredFlat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cc = filteredFlat[highlightIdx]
      if (cc) handleSelect(cc.ledgerCode, cc.label)
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
    }
  }

  // ── Flat index tracker across grouped rendering ───────────────────────────────
  // We need a counter that increments as we iterate groups, so keyboard
  // highlight index stays consistent with filteredFlat ordering.
  let flatIdx = 0

  // ── Disabled view ────────────────────────────────────────────────────────────

  if (disabled) {
    if (!selectedCode) {
      return <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
    }
    const cc = COST_CENTRES.find(c => c.ledgerCode === selectedCode)
    return (
      <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
        {selectedCode}{cc ? ` ${cc.label}` : ''}
      </span>
    )
  }

  // ── Normal (interactive) view ─────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 min-w-[200px]">

      {/* Current-code chip */}
      {selectedCode && (() => {
        const cc = COST_CENTRES.find(c => c.ledgerCode === selectedCode)
        return (
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border self-start cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              color: 'var(--green)',
              background: '#f0fdf4',
              borderColor: '#bbf7d0',
            }}
            title="Click to change"
          >
            <span>✓</span>
            <span>{selectedCode}{cc ? ` ${cc.label}` : ''}</span>
          </button>
        )
      })()}

      {/* Suggestion pills row */}
      <div className="flex flex-wrap gap-1">
        {loading ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
            {/* Spinner */}
            <svg
              className="animate-spin h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Suggesting…
          </span>
        ) : (
          suggestions.slice(0, 3).map(s => {
            const isSelected = selectedCode === s.costCentre.ledgerCode
            return (
              <button
                key={s.costCentre.id}
                type="button"
                onClick={() => handlePillClick(s)}
                className={[
                  'text-xs font-medium px-2 py-0.5 rounded-full border transition-all',
                  CONFIDENCE_CLASSES[s.confidence],
                  isSelected ? 'ring-2 ring-[var(--brand)]' : 'hover:opacity-80',
                ].join(' ')}
                title={s.reason ?? `Confidence: ${s.confidence}`}
              >
                {s.costCentre.ledgerCode} {s.costCentre.label}
                {isSelected && <span className="ml-1">✓</span>}
              </button>
            )
          })
        )}
      </div>

      {/* Auto-match label */}
      {suggestions.length > 0 && suggestions[0].reason === 'Auto-matched via Square' && (
        <p style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic', marginTop: '2px' }}>
          Auto-matched via Square
        </p>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input-field !py-1 !text-xs"
          placeholder="Search accounts…"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value)
            setHighlightIdx(0)
            setDropdownOpen(true)
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleInputKeyDown}
          aria-label="Search cost centres"
          aria-expanded={dropdownOpen}
          aria-autocomplete="list"
          autoComplete="off"
        />

        {/* Dropdown list */}
        {dropdownOpen && filteredFlat.length > 0 && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg border shadow-lg text-xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            {groupedOptions.map(([category, items]) => (
              <li key={category} role="presentation">
                {/* Category heading */}
                <div
                  className="px-2 pt-2 pb-0.5 section-label sticky top-0"
                  style={{ background: 'var(--surface)' }}
                >
                  {category}
                </div>

                {items.map(cc => {
                  const idx     = flatIdx++
                  const isHigh  = idx === highlightIdx
                  const isSel   = cc.ledgerCode === selectedCode

                  return (
                    <li
                      key={cc.id}
                      role="option"
                      aria-selected={isSel}
                      className={[
                        'flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors',
                        isHigh
                          ? 'text-white'
                          : isSel
                          ? 'font-medium'
                          : '',
                      ].join(' ')}
                      style={{
                        background: isHigh ? 'var(--brand)' : isSel ? 'rgba(29,158,117,0.08)' : undefined,
                        color: isHigh ? 'white' : isSel ? 'var(--brand)' : 'var(--text-2)',
                      }}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      onMouseDown={e => {
                        // Prevent input blur before click fires
                        e.preventDefault()
                        handleSelect(cc.ledgerCode, cc.label)
                      }}
                    >
                      <span>{cc.ledgerCode} {cc.label}</span>
                      {isSel && !isHigh && (
                        <span style={{ color: 'var(--brand)' }}>✓</span>
                      )}
                    </li>
                  )
                })}
              </li>
            ))}

            {filteredFlat.length === 0 && (
              <li className="px-3 py-2" style={{ color: 'var(--text-3)' }}>
                No accounts found
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
