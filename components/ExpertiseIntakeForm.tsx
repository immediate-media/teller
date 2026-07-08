'use client'

import { useState } from 'react'
import type { ExpertiseResponse } from '@/types'
import { DebugPanel, makeDebugEntry, useDebugMode, type DebugEntry } from '@/components/DebugPanel'

type Props = {
  onResult: (data: Extract<ExpertiseResponse, { ok: true }>) => void
  onLoadingChange?: (loading: boolean) => void
}

export function ExpertiseIntakeForm({ onResult, onLoadingChange }: Props) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugEvents, setDebugEvents] = useState<DebugEntry[]>([])
  const [fetchError, setFetchError] = useState<string | undefined>()
  const debugMode = useDebugMode()

  function logDebug(raw: string) {
    if (!debugMode) return
    setDebugEvents((prev) => [...prev, makeDebugEntry(raw)])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDebugEvents([])
    setFetchError(undefined)
    setLoading(true)
    onLoadingChange?.(true)

    try {
      const res = await fetch('/api/expertise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      if (!res.ok) {
        let errMsg = `Server returned ${res.status}`
        try {
          const data = await res.json()
          errMsg = data.error ?? errMsg
        } catch {
          try { errMsg = `${errMsg}: ${await res.text()}` } catch { /* ignore */ }
        }
        setError(errMsg)
        if (debugMode) setFetchError(errMsg)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const line = chunk.trim()
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6)
          logDebug(raw)
          const data = JSON.parse(raw)

          if (data.event === 'result') {
            onResult({ ok: true, id: data.id, result: data.result, evidence: data.evidence })
            return
          } else if (data.event === 'error') {
            setError(data.message)
            return
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
      if (debugMode) setFetchError(msg)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          <label htmlFor="question" className="sr-only">What do you need help with?</label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Who knows about GTM consent validation?"
            required
            autoFocus
            className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="shrink-0 min-h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {loading ? 'Working…' : 'Find who to ask'}
          </button>
        </div>

        {error && (
          <div className="mx-3 mb-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </form>

      {debugMode && <DebugPanel events={debugEvents} fetchError={fetchError} />}
    </div>
  )
}
