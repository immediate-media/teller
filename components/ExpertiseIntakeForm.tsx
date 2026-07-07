'use client'

import { useState } from 'react'
import type { ExpertiseResponse } from '@/types'

type Props = {
  onResult: (data: Extract<ExpertiseResponse, { ok: true }>) => void
}

export function ExpertiseIntakeForm({ onResult }: Props) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/expertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const data: ExpertiseResponse = await res.json()

      if (!data.ok) {
        setError(data.error)
        return
      }

      onResult(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Who to talk to</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ask a question. Get pointed at the person with the evidence to back it up.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-zinc-300 mb-1.5">
            What do you need help with?
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Who knows about GTM consent validation?"
            required
            rows={3}
            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-950 border border-red-800 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          {loading ? 'Searching…' : 'Find who to talk to'}
        </button>

        {loading && (
          <p className="text-center text-xs text-zinc-500">
            Searching commit history, Jira, and Confluence — usually 20–40 seconds.
          </p>
        )}
      </form>
    </div>
  )
}
