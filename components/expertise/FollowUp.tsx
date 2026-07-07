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
            <div key={i} className="border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-medium text-white mb-1">{turn.question}</p>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{turn.answer}</p>
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
          className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />

        {error && (
          <div className="rounded-md bg-red-950 border border-red-800 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          {loading ? 'Digging…' : 'Ask'}
        </button>
        {loading && <p className="text-xs text-zinc-500">Fetching more detail — this can take a minute.</p>}
      </form>
    </BriefingSection>
  )
}
