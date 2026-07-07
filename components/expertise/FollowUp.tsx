'use client'

import { useState } from 'react'
import type { EvidenceBundle, ExpertiseOutput, FollowUpResponse } from '@/types'
import { BriefingSection } from '@/components/briefing/BriefingSection'

type Turn = { question: string; answer: string }

type Props = {
  question: string
  result: ExpertiseOutput
  evidence: EvidenceBundle
}

export function FollowUp({ question, result, evidence }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/expertise/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId ?? undefined,
          question: trimmed,
          context: sessionId ? undefined : { question, result, evidence },
        }),
      })

      const data: FollowUpResponse = await res.json()

      if (!data.ok) {
        setError(data.error)
        return
      }

      setSessionId(data.sessionId)
      setTurns((prev) => [...prev, { question: trimmed, answer: data.answer }])
      setInput('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <BriefingSection title="Dig deeper">
      {turns.length > 0 && (
        <div className="space-y-4 mb-4">
          {turns.map((turn, i) => (
            <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium mb-1">{turn.question}</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{turn.answer}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAsk} className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Follow the FAB2-167 link — who else is involved?"
          rows={2}
          className="w-full rounded-md bg-card border border-border px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
        />

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {loading ? 'Digging…' : 'Ask'}
        </button>
        {loading && <p className="text-xs text-muted-foreground">Fetching more detail — this can take a minute.</p>}
      </form>
    </BriefingSection>
  )
}
