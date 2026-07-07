'use client'

import { useState } from 'react'
import type { BriefingMeta, BriefingOutput } from '@/types'

type Props = {
  onResult: (id: string, briefing: BriefingOutput, meta: BriefingMeta) => void
}

export function IntakeForm({ onResult }: Props) {
  const [repoPath, setRepoPath] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath }),
      })

      const data = await res.json()

      if (!data.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

      onResult(data.id as string, data.briefing as BriefingOutput, data.meta as BriefingMeta)
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
        <h1 className="text-2xl font-semibold text-white tracking-tight">Project Teller</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Point it at a project. Get a PM briefing in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="repoPath" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Repository path
          </label>
          <input
            id="repoPath"
            type="text"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="/Users/you/Repos/my-project"
            required
            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Absolute path to a local directory. Must contain a README.md.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-950 border border-red-800 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !repoPath.trim()}
          className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          {loading ? 'Analysing…' : 'Generate briefing'}
        </button>

        {loading && (
          <p className="text-center text-xs text-zinc-500">
            Generating your briefing — usually 30–40 seconds.
          </p>
        )}
      </form>
    </div>
  )
}

