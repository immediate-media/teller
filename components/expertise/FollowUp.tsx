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
        <div className="space-y-4 mb-5">
          {turns.map((turn, i) => (
            <div key={i} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {turn.question}
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{turn.answer}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAsk}>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 focus-within:border-foreground/30 transition-colors">
          <label htmlFor="followup-question" className="sr-only">Dig deeper</label>
          <input
            id="followup-question"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Who else is on FAB2-167?"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Digging…' : 'Ask'}
          </button>
        </div>

        {error && (
          <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </form>
    </BriefingSection>
  )
}
