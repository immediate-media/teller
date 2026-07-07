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
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => rate('good')}
        disabled={saving}
        title="Accurate"
        aria-pressed={rating === 'good'}
        className={
          'inline-flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ' +
          (rating === 'good'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary')
        }
      >
        👍
      </button>
      <button
        onClick={() => rate('bad')}
        disabled={saving}
        title="Not accurate"
        aria-pressed={rating === 'bad'}
        className={
          'inline-flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ' +
          (rating === 'bad'
            ? 'border-destructive bg-destructive text-destructive-foreground'
            : 'border-border bg-background text-muted-foreground hover:border-destructive/50 hover:text-destructive')
        }
      >
        👎
      </button>
      {rating === 'good' && (
        <a
          href={`/api/results/${resultId}/export`}
          download
          className="ml-1 text-xs text-primary hover:underline transition-colors"
          title="Download schema export"
        >
          ↓ Export JSON
        </a>
      )}
    </div>
  )
}
