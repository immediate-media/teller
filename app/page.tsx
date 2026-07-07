'use client'

import { useState, useEffect } from 'react'
import { IntakeForm } from '@/components/IntakeForm'
import { BriefingView } from '@/components/briefing/BriefingView'
import { ModeTabs, type Mode } from '@/components/ModeTabs'
import { ExpertiseIntakeForm } from '@/components/ExpertiseIntakeForm'
import { ExpertiseView } from '@/components/expertise/ExpertiseView'
import type { BriefingMeta, BriefingOutput, ExpertiseResponse } from '@/types'

type ExpertiseSuccess = Extract<ExpertiseResponse, { ok: true }>
type BriefingResult = { briefing: BriefingOutput; meta: BriefingMeta }

export default function Home() {
  const [mode, setMode] = useState<Mode>('briefing')
  const [briefingResult, setBriefingResult] = useState<BriefingResult | null>(null)
  const [expertise, setExpertise] = useState<ExpertiseSuccess | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [briefingResult, expertise])

  if (briefingResult) {
    return (
      <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-16">
        <BriefingView briefing={briefingResult.briefing} meta={briefingResult.meta} onReset={() => setBriefingResult(null)} />
      </main>
    )
  }

  if (expertise) {
    return (
      <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-16">
        <ExpertiseView result={expertise.result} evidence={expertise.evidence} onReset={() => setExpertise(null)} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center">
        <ModeTabs mode={mode} onChange={setMode} />
        {mode === 'briefing'
          ? <IntakeForm onResult={(briefing, meta) => setBriefingResult({ briefing, meta })} />
          : <ExpertiseIntakeForm onResult={setExpertise} />}
      </div>
    </main>
  )
}

