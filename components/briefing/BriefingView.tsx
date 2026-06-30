import type { BriefingOutput } from '@/types'
import { BriefingSection } from './BriefingSection'
import { StatusBadge } from './StatusBadge'
import { RiskRow } from './RiskRow'

type Props = {
  briefing: BriefingOutput
  onReset: () => void
}

export function BriefingView({ briefing, onReset }: Props) {
  const { projectName, oneLiner, sections } = briefing

  return (
    <div className="max-w-2xl w-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">{projectName}</h1>
          <p className="mt-1 text-sm text-zinc-400">{oneLiner}</p>
        </div>
        <button
          onClick={onReset}
          className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
        >
          ← New briefing
        </button>
      </div>

      <div className="space-y-3">
        {/* Current state */}
        <BriefingSection title="Current state">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={sections.currentState.status} />
            {sections.currentState.version && (
              <span className="text-xs text-zinc-500">v{sections.currentState.version}</span>
            )}
            {sections.currentState.tickets?.map((t) => (
              <span key={t} className="text-xs text-indigo-400 font-mono">{t}</span>
            ))}
          </div>
          <p className="text-sm text-zinc-300">{sections.currentState.notes}</p>
        </BriefingSection>

        {/* Summary */}
        <BriefingSection title="Summary">
          <p className="text-sm text-zinc-300">{sections.summary}</p>
        </BriefingSection>

        {/* Why it exists */}
        <BriefingSection title="Why it exists">
          <p className="text-sm text-zinc-300">{sections.whyItExists}</p>
        </BriefingSection>

        {/* How it works */}
        <BriefingSection title="How it works">
          <p className="text-sm text-zinc-300">{sections.howItWorks}</p>
        </BriefingSection>

        {/* Who is affected */}
        <BriefingSection title="Who is affected">
          <p className="text-sm text-zinc-300">{sections.whoIsAffected}</p>
        </BriefingSection>

        {/* Dependencies */}
        {sections.dependencies.length > 0 && (
          <BriefingSection title="Dependencies">
            <div className="space-y-2">
              {sections.dependencies.map((dep, i) => (
                <div key={i} className="border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white">{dep.name}</span>
                    <span className="text-xs text-zinc-500">{dep.relationship}</span>
                  </div>
                  {dep.note && <p className="text-xs text-zinc-400 mt-0.5">{dep.note}</p>}
                </div>
              ))}
            </div>
          </BriefingSection>
        )}

        {/* Risks */}
        {sections.risks.length > 0 && (
          <BriefingSection title="Risks &amp; gotchas">
            {sections.risks.map((r, i) => (
              <RiskRow key={i} risk={r.risk} severity={r.severity} />
            ))}
          </BriefingSection>
        )}

        {/* Who to talk to */}
        <BriefingSection title="Who to talk to">
          <p className="text-sm text-zinc-300">{sections.whoToTalkTo}</p>
        </BriefingSection>

        {/* Upcoming work */}
        <BriefingSection title="Upcoming work">
          <p className="text-sm text-zinc-300">{sections.upcomingWork}</p>
        </BriefingSection>

        {/* Glossary */}
        {sections.glossary.length > 0 && (
          <BriefingSection title="Glossary">
            <dl className="space-y-2">
              {sections.glossary.map((g, i) => (
                <div key={i}>
                  <dt className="text-sm font-medium text-white">{g.term}</dt>
                  <dd className="text-sm text-zinc-400">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </BriefingSection>
        )}
      </div>
    </div>
  )
}
