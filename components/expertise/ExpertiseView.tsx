import type { EvidenceBundle, ExpertiseOutput } from '@/types'
import { BriefingSection } from '@/components/briefing/BriefingSection'
import { CandidateCard } from './CandidateCard'
import { FollowUp } from './FollowUp'
import { RatingButtons } from '@/components/RatingButtons'

type Props = {
  id: string
  result: ExpertiseOutput
  evidence: EvidenceBundle
  onReset: () => void
}

export function ExpertiseView({ id, result, evidence, onReset }: Props) {
  const hasAnyCandidates = result.makers.length > 0 || result.maintainers.length > 0

  return (
    <div className="max-w-2xl w-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">{result.question}</h1>
          <p className="mt-1 text-sm text-zinc-400">{result.summary}</p>
        </div>
        <div className="flex items-center gap-3">
          <RatingButtons resultId={id} />
          <button
            onClick={onReset}
            className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
          >
            ← New question
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {result.noClearMatch || !hasAnyCandidates ? (
          <BriefingSection title="No clear match">
            <p className="text-sm text-zinc-300">{result.summary}</p>
          </BriefingSection>
        ) : (
          <>
            {result.makers.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Who built this</h2>
                {result.makers.map((candidate, i) => (
                  <CandidateCard key={`maker-${i}`} rank={i + 1} candidate={candidate} />
                ))}
              </div>
            )}

            {result.maintainers.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Who&apos;s worked on it recently</h2>
                {result.maintainers.map((candidate, i) => (
                  <CandidateCard key={`maintainer-${i}`} rank={i + 1} candidate={candidate} />
                ))}
              </div>
            )}
          </>
        )}

        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-300">Raw evidence (debug)</summary>
          <div className="mt-2 space-y-1 pl-1">
            <p>
              Git: {evidence.git.items.length} author(s) across {evidence.git.reposScanned} repo(s) scanned
              {evidence.git.reposSkipped > 0 ? `, ${evidence.git.reposSkipped} skipped` : ''} — status: {evidence.git.status}
            </p>
            <p>
              Jira: {evidence.jira.items.length} issue(s) — status: {evidence.jira.status}
            </p>
            <p>
              Confluence: {evidence.confluence.items.length} page(s) — status: {evidence.confluence.status}
            </p>
            <p>Keywords used: {evidence.keywords.join(', ') || 'none'}</p>
          </div>
        </details>

        <FollowUp question={result.question} result={result} evidence={evidence} />
      </div>
    </div>
  )
}
