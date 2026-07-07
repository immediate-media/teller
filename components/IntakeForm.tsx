'use client'

import { useState } from 'react'
import type { BriefingMeta, BriefingOutput } from '@/types'
import { ThinkingBubbles } from '@/components/ThinkingBubbles'
import { DebugPanel, makeDebugEntry, useDebugMode, type DebugEntry } from '@/components/DebugPanel'

type Props = {
  onResult: (id: string, briefing: BriefingOutput, meta: BriefingMeta) => void
}

export function IntakeForm({ onResult }: Props) {
  const [repoPath, setRepoPath] = useState('')
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

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
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
            onResult(data.id, data.briefing, data.meta)
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
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 focus-within:border-foreground/40 focus-within:bg-card">
          <label htmlFor="repoPath" className="sr-only">Repository path</label>
          <input
            id="repoPath"
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="/Users/you/Repos/my-project"
            required
            autoFocus
            className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            disabled={loading || !repoPath.trim()}
            className="min-h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {loading ? 'Working…' : 'Brief me'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Absolute path to a local directory. Must contain a README.md.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {loading && <ThinkingBubbles />}
        {debugMode && <DebugPanel events={debugEvents} fetchError={fetchError} />}
      </form>
    </div>
  )
}
