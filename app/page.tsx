'use client'

import { useState, useEffect } from 'react'
import { IntakeForm } from '@/components/IntakeForm'
import { BriefingView } from '@/components/briefing/BriefingView'
import { ModeTabs, type Mode } from '@/components/ModeTabs'
import { ExpertiseIntakeForm } from '@/components/ExpertiseIntakeForm'
import { ExpertiseView } from '@/components/expertise/ExpertiseView'
import { HistoryView } from '@/components/HistoryView'
import type { BriefingMeta, BriefingOutput, ExpertiseResponse, StoredResult } from '@/types'

type ExpertiseSuccess = Extract<ExpertiseResponse, { ok: true }>
type BriefingResult = { id: string; briefing: BriefingOutput; meta: BriefingMeta }

export default function Home() {
  const [mode, setMode] = useState<Mode>('briefing')
  const [briefingResult, setBriefingResult] = useState<BriefingResult | null>(null)
  const [expertise, setExpertise] = useState<ExpertiseSuccess | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [briefingResult, expertise])

  async function handleHistorySelect(id: string) {
    const res = await fetch(`/api/results/${id}`)
    if (!res.ok) return
    const stored: StoredResult = await res.json()
    if (stored.type === 'briefing') {
      setBriefingResult({ id: stored.id, briefing: stored.briefing, meta: stored.meta })
    } else {
      setExpertise({ ok: true, id: stored.id, result: stored.result, evidence: stored.evidence })
    }
  }

  if (briefingResult) {
    return (
      <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-16">
        <BriefingView
          id={briefingResult.id}
          briefing={briefingResult.briefing}
          meta={briefingResult.meta}
          onReset={() => setBriefingResult(null)}
        />
      </main>
    )
  }

  if (expertise) {
    return (
      <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-16">
        <ExpertiseView
          id={expertise.id}
          result={expertise.result}
          evidence={expertise.evidence}
          onReset={() => setExpertise(null)}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center">
        <ModeTabs mode={mode} onChange={setMode} />
        {mode === 'briefing' && (
          <IntakeForm onResult={(id, briefing, meta) => setBriefingResult({ id, briefing, meta })} />
        )}
        {mode === 'expertise' && (
          <ExpertiseIntakeForm onResult={setExpertise} />
        )}
        {mode === 'history' && (
          <HistoryView onSelect={handleHistorySelect} />
        )}
      </div>
    </main>
  )
}

