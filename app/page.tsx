'use client'

import { useState, useEffect } from 'react'
import { IntakeForm } from '@/components/IntakeForm'
import { BriefingView } from '@/components/briefing/BriefingView'
import type { BriefingOutput } from '@/types'

export default function Home() {
  const [briefing, setBriefing] = useState<BriefingOutput | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [briefing])

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center px-4 py-16">
      {briefing ? (
        <BriefingView briefing={briefing} onReset={() => setBriefing(null)} />
      ) : (
        <IntakeForm onResult={setBriefing} />
      )}
    </main>
  )
}
