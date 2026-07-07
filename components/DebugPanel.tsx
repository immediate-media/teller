'use client'

import { useEffect, useState } from 'react'

export interface DebugEntry {
  ts: string
  raw: string
  parsed?: object
  error?: string
}

interface Props {
  events: DebugEntry[]
  fetchError?: string
}

export function DebugPanel({ events, fetchError }: Props) {
  const [healthData, setHealthData] = useState<object | null>(null)
  const [probeData, setProbeData] = useState<object | null>(null)
  const [probeLoading, setProbeLoading] = useState(false)

  useEffect(() => {
    fetch('/api/debug')
      .then((r) => r.json())
      .then(setHealthData)
      .catch((e) => setHealthData({ error: String(e) }))
  }, [])

  async function runProbe() {
    setProbeLoading(true)
    try {
      const r = await fetch('/api/debug/probe')
      setProbeData(await r.json())
    } catch (e) {
      setProbeData({ error: String(e) })
    } finally {
      setProbeLoading(false)
    }
  }

  return (
    <div className="mt-6 border border-yellow-400 rounded-lg p-4 bg-yellow-50 text-xs font-mono text-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-yellow-700 text-sm">🔧 Debug Mode</span>
        <button
          onClick={runProbe}
          disabled={probeLoading}
          className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded text-xs disabled:opacity-50"
        >
          {probeLoading ? 'Testing…' : 'Test Claude API'}
        </button>
      </div>

      {healthData && (
        <section>
          <p className="font-semibold text-yellow-700 mb-1">Environment (/api/debug)</p>
          <pre className="overflow-auto max-h-48 bg-white border border-yellow-200 rounded p-2 whitespace-pre-wrap">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </section>
      )}

      {probeData && (
        <section>
          <p className="font-semibold text-yellow-700 mb-1">Claude API probe (/api/debug/probe)</p>
          <pre className="overflow-auto max-h-32 bg-white border border-yellow-200 rounded p-2 whitespace-pre-wrap">
            {JSON.stringify(probeData, null, 2)}
          </pre>
        </section>
      )}

      {fetchError && (
        <section>
          <p className="font-semibold text-red-600 mb-1">Fetch error</p>
          <pre className="bg-red-50 border border-red-200 rounded p-2 whitespace-pre-wrap">{fetchError}</pre>
        </section>
      )}

      {events.length > 0 && (
        <section>
          <p className="font-semibold text-yellow-700 mb-1">SSE event log ({events.length})</p>
          <div className="overflow-auto max-h-64 bg-white border border-yellow-200 rounded p-2 space-y-1">
            {events.map((e, i) => (
              <div key={i} className={`${e.error ? 'text-red-600' : 'text-gray-700'}`}>
                <span className="text-gray-400">[{e.ts}]</span> {e.error ? `PARSE ERROR: ${e.error} — ` : ''}{e.raw}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function useDebugMode() {
  const [enabled] = useState(() =>
    typeof window !== 'undefined' && window.location.search.includes('debug')
  )
  return enabled
}

export function makeDebugEntry(raw: string): DebugEntry {
  const ts = new Date().toISOString().split('T')[1].slice(0, 12)
  try {
    return { ts, raw, parsed: JSON.parse(raw) }
  } catch (e) {
    return { ts, raw, error: e instanceof Error ? e.message : String(e) }
  }
}
