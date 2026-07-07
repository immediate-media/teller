'use client'

import { useEffect, useState } from 'react'
import type { ResultSummary } from '@/types'

type Props = {
  onSelect: (id: string) => void
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${(days / 365).toFixed(1)}y ago`
}

const RATING_ICON: Record<string, string> = { good: '👍', bad: '👎' }
const TYPE_LABEL: Record<string, string> = { briefing: 'Briefing', expertise: 'Who to talk to' }

export function HistoryView({ onSelect }: Props) {
  const [results, setResults] = useState<ResultSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/results')
      .then((r) => r.json())
      .then((data: ResultSummary[]) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading history…</p>
  }

  if (results.length === 0) {
    return (
      <div className="max-w-xl w-full text-center py-12">
        <p className="text-sm text-muted-foreground">No saved results yet. Generate a briefing or expertise result to see it here.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl w-full divide-y divide-border rounded-lg border border-border bg-card">
      {results.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className="w-full text-left px-4 py-3 transition-colors hover:bg-secondary/40 group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {r.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {TYPE_LABEL[r.type]} · {relativeDate(r.createdAt)}
              </p>
            </div>
            {r.rating && (
              <span className="shrink-0 text-sm">{RATING_ICON[r.rating]}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
