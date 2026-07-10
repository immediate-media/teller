'use client'

import { useState } from 'react'
import type { EvidenceBundle, ExpertiseOutput, ResultRating } from '@/types'
import { BriefingSection } from '@/components/briefing/BriefingSection'
import { CandidateCard } from './CandidateCard'
import { FollowUp } from './FollowUp'
import { RatingButtons } from '@/components/RatingButtons'
import { cn } from '@/lib/utils'

type Tab = 'maintainers' | 'makers'

type Props = {
  id: string
  result: ExpertiseOutput
  evidence: EvidenceBundle
  initialRating?: ResultRating
}

export function ExpertiseView({ id, result, evidence, initialRating }: Props) {
  const [tab, setTab] = useState<Tab>('maintainers')
  const hasAnyCandidates = result.makers.length > 0 || result.maintainers.length > 0
  const confluenceSkipped = evidence.confluence.status === 'skipped' || evidence.confluence.status === 'error'

  const topMatch = result.maintainers[0] ?? result.makers[0] ?? null
  const totalCount = result.maintainers.length + result.makers.length

  const sourceParts = [
    evidence.git.status === 'ok' && evidence.git.items.length > 0
      && `Git (${evidence.git.items.length} contributor${evidence.git.items.length !== 1 ? 's' : ''})`,
    evidence.jira.status === 'ok' && evidence.jira.items.length > 0
      && `Jira (${evidence.jira.items.length} issue${evidence.jira.items.length !== 1 ? 's' : ''})`,
    evidence.confluence.status === 'ok' && evidence.confluence.items.length > 0
      && `Confluence (${evidence.confluence.items.length} page${evidence.confluence.items.length !== 1 ? 's' : ''})`,
  ].filter(Boolean) as string[]

  type Bullet = { label: string; value: string }
  const bullets: Bullet[] = [
    topMatch && {
      label: 'Top match',
      value: `${topMatch.name} · ${topMatch.confidence} confidence`,
    },
    totalCount > 0 && {
      label: 'People found',
      value: [
        result.maintainers.length > 0 && `${result.maintainers.length} maintaining`,
        result.makers.length > 0 && `${result.makers.length} made it`,
      ].filter(Boolean).join(', '),
    },
    sourceParts.length > 0 && {
      label: 'Sources',
      value: sourceParts.join(' · '),
    },
  ].filter(Boolean) as Bullet[]

  return (
    <div className="max-w-2xl w-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold tracking-tight">{result.question}</h1>
          {bullets.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {bullets.map((b) => (
                <li key={b.label} className="flex items-baseline gap-3 text-sm">
                  <span className="w-[88px] shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-5">
                    {b.label}
                  </span>
                  <span className="text-foreground/80">{b.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <RatingButtons resultId={id} initialRating={initialRating} />
      </div>

      {confluenceSkipped && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 text-amber-500 shrink-0">⚠</span>
          <p className="text-sm text-amber-800">
            <span className="font-medium">Confluence not connected</span> — recommendations based on git history only.
            Doc authorship is a stronger signal for who to talk to. Add Atlassian credentials to `.env.local` for more accurate results.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {result.noClearMatch || !hasAnyCandidates ? (
          <BriefingSection title="No clear match">
            <p className="text-sm text-foreground/80">{result.summary}</p>
          </BriefingSection>
        ) : (
          <>
            {/* Tab selector */}
            <div className="flex gap-2">
              {([
                { id: 'maintainers' as const, label: 'Working on it now', count: result.maintainers.length },
                { id: 'makers' as const, label: 'Who built it', count: result.makers.length },
              ]).map(({ id: tabId, label, count }) => (
                <button
                  key={tabId}
                  onClick={() => setTab(tabId)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                    tab === tabId
                      ? 'border-primary bg-primary text-primary-foreground font-medium'
                      : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {label}
                  {count > 0 && (
                    <span className={cn(
                      'ml-1.5 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-medium',
                      tab === tabId ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            {tab === 'maintainers' && (
              <div className="space-y-3">
                {result.maintainers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No recent contributors identified.</p>
                ) : (
                  result.maintainers.map((candidate, i) => (
                    <CandidateCard key={`maintainer-${i}`} rank={i + 1} candidate={candidate} />
                  ))
                )}
              </div>
            )}

            {tab === 'makers' && (
              <div className="space-y-3">
                {result.makers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No original makers identified.</p>
                ) : (
                  result.makers.map((candidate, i) => (
                    <CandidateCard key={`maker-${i}`} rank={i + 1} candidate={candidate} />
                  ))
                )}
              </div>
            )}
          </>
        )}

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Raw evidence (debug)</summary>
          <div className="mt-2 space-y-1 pl-1">
            <p>
              Git: {evidence.git.items.length} author(s) across {evidence.git.reposScanned} repo(s) scanned
              {evidence.git.reposSkipped > 0 ? `, ${evidence.git.reposSkipped} skipped` : ''} — status: {evidence.git.status}
            </p>
            <p>Jira: {evidence.jira.items.length} issue(s) — status: {evidence.jira.status}</p>
            <p>Confluence: {evidence.confluence.items.length} page(s) — status: {evidence.confluence.status}</p>
            <p>Keywords used: {evidence.keywords.join(', ') || 'none'}</p>
          </div>
        </details>

        <FollowUp question={result.question} result={result} evidence={evidence} />
      </div>
    </div>
  )
}
