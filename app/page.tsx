'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { AppShell, type SideMode } from '@/components/AppShell'
import { IntakeForm } from '@/components/IntakeForm'
import { BriefingView } from '@/components/briefing/BriefingView'
import { ExpertiseIntakeForm } from '@/components/ExpertiseIntakeForm'
import { ExpertiseView } from '@/components/expertise/ExpertiseView'
import { HistoryView } from '@/components/HistoryView'
import { cn } from '@/lib/utils'
import type { BriefingMeta, BriefingOutput, ExpertiseResponse, StoredResult } from '@/types'

type AskSubMode = 'briefing' | 'expertise'
type ExpertiseSuccess = Extract<ExpertiseResponse, { ok: true }>
type BriefingResult = { id: string; briefing: BriefingOutput; meta: BriefingMeta }

export default function Home() {
  const [sideMode, setSideMode] = useState<SideMode>('ask')
  const [subMode, setSubMode] = useState<AskSubMode>('expertise')
  const [briefingResult, setBriefingResult] = useState<BriefingResult | null>(null)
  const [expertise, setExpertise] = useState<ExpertiseSuccess | null>(null)

  function handleReset() {
    setBriefingResult(null)
    setExpertise(null)
  }

  async function handleHistorySelect(id: string) {
    const res = await fetch(`/api/results/${id}`)
    if (!res.ok) return
    const stored: StoredResult = await res.json()
    if (stored.type === 'briefing') {
      setBriefingResult({ id: stored.id, briefing: stored.briefing, meta: stored.meta })
    } else {
      setExpertise({ ok: true, id: stored.id, result: stored.result, evidence: stored.evidence })
    }
    setSideMode('ask')
  }

  const showResult = !!briefingResult || !!expertise

  return (
    <AppShell mode={sideMode} onModeChange={(m) => { setSideMode(m); if (m === 'ask') handleReset() }}>
      <AnimatePresence mode="wait">
        {/* Result views */}
        {briefingResult && (
          <motion.div
            key="briefing-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-3xl px-6 py-10 md:py-14"
          >
            <button
              onClick={handleReset}
              className="-ml-1 mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" /> New question
            </button>
            <BriefingView
              id={briefingResult.id}
              briefing={briefingResult.briefing}
              meta={briefingResult.meta}
            />
          </motion.div>
        )}

        {expertise && !briefingResult && (
          <motion.div
            key="expertise-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-3xl px-6 py-10 md:py-14"
          >
            <button
              onClick={handleReset}
              className="-ml-1 mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" /> New question
            </button>
            <ExpertiseView
              id={expertise.id}
              result={expertise.result}
              evidence={expertise.evidence}
            />
          </motion.div>
        )}

        {/* Ask page */}
        {!showResult && sideMode === 'ask' && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-3xl px-6 py-12 md:py-20"
          >
            <div className="mb-8">
              <div className="bg-brand-gradient mb-4 h-1.5 w-20 rounded-full" />
              <h1 className="font-display font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-[clamp(1.5rem,4.5vw,2.75rem)]">
                What are you trying to{' '}
                <span className="text-brand-gradient">figure out?</span>
              </h1>
            </div>

            {/* Unified search container */}
            <div className="rounded-xl border border-border bg-card/60 overflow-hidden focus-within:border-foreground/40 focus-within:bg-card transition-colors">
              {/* Mode pills row */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2.5 border-b border-border/60">
                <button
                  disabled
                  title="Coming soon"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-transparent px-3 py-1 text-xs font-medium text-muted-foreground/40 cursor-not-allowed select-none"
                >
                  Project briefing
                </button>
                <button
                  type="button"
                  onClick={() => setSubMode('expertise')}
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    subMode === 'expertise'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  Who to ask
                </button>
              </div>

              {/* Form area */}
              <div className="px-3 py-2.5">
                {subMode === 'briefing' && (
                  <IntakeForm onResult={(id, briefing, meta) => setBriefingResult({ id, briefing, meta })} />
                )}
                {subMode === 'expertise' && (
                  <ExpertiseIntakeForm onResult={setExpertise} />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* History page */}
        {sideMode === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-3xl px-6 py-12 md:py-20"
          >
            <div className="mb-8">
              <div className="bg-brand-gradient mb-4 h-1.5 w-20 rounded-full" />
              <h1 className="font-display font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-[clamp(1.5rem,4.5vw,2.75rem)]">
                Past results
              </h1>
            </div>
            <HistoryView onSelect={handleHistorySelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}

