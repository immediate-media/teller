'use client'

import { useState } from 'react'
import type { ResultRating } from '@/types'

type Props = {
  resultId: string
  initialRating?: ResultRating
}

export function RatingButtons({ resultId, initialRating = null }: Props) {
  const [rating, setRating] = useState<ResultRating>(initialRating)
  const [saving, setSaving] = useState(false)

  async function rate(value: 'good' | 'bad') {
    const next: ResultRating = rating === value ? null : value
    setSaving(true)
    try {
      await fetch(`/api/results/${resultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: next }),
      })
      setRating(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => rate('good')}
        disabled={saving}
        title="Good result"
        className={`px-2 py-1 rounded text-sm transition-colors disabled:opacity-50 ${
          rating === 'good'
            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            : 'text-zinc-600 hover:text-zinc-400'
        }`}
      >
        👍
      </button>
      <button
        onClick={() => rate('bad')}
        disabled={saving}
        title="Bad result"
        className={`px-2 py-1 rounded text-sm transition-colors disabled:opacity-50 ${
          rating === 'bad'
            ? 'bg-red-950 text-red-400 border border-red-800'
            : 'text-zinc-600 hover:text-zinc-400'
        }`}
      >
        👎
      </button>
      {rating === 'good' && (
        <a
          href={`/api/results/${resultId}/export`}
          download
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-1"
          title="Download schema export"
        >
          ↓ Export JSON
        </a>
      )}
    </div>
  )
}
