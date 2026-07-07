import type { BriefingMeta, BriefingOutput } from '@/types'
import { BriefingSection } from './BriefingSection'
import { StatusBadge } from './StatusBadge'
import { RiskRow } from './RiskRow'
import { RatingButtons } from '@/components/RatingButtons'

type Props = {
  id: string
  briefing: BriefingOutput
  meta: BriefingMeta
}

export function BriefingView({ id, briefing, meta }: Props) {
  const { projectName, oneLiner, sections } = briefing
  const hasContributors = meta.owner || meta.recentContributors.length > 0

  return (
    <div className="max-w-2xl w-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">{projectName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{oneLiner}</p>
        </div>
        <RatingButtons resultId={id} />
      </div>

      {hasContributors && (
        <div className="flex items-start gap-8 mb-6 border border-border rounded-xl px-5 py-4 bg-card">
          {meta.owner && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Owner</p>
              <p className="text-sm font-medium">{meta.owner.name}</p>
              <p className="text-xs text-muted-foreground">{meta.owner.commitCount} commits</p>
            </div>
          )}
          {meta.recentContributors.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Recently active</p>
              <div className="space-y-1">
                {meta.recentContributors.map((c, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="text-sm">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.commitCount} commits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <BriefingSection title="Current state">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={sections.currentState.status} />
            {sections.currentState.version && (
              <span className="text-xs text-muted-foreground">v{sections.currentState.version}</span>
            )}
            {sections.currentState.tickets?.map((t) => (
              <span key={t} className="text-xs text-primary font-mono">{t}</span>
            ))}
          </div>
          <p className="text-sm text-foreground/80">{sections.currentState.notes}</p>
        </BriefingSection>

        <BriefingSection title="Summary">
          <p className="text-sm text-foreground/80">{sections.summary}</p>
        </BriefingSection>

        <BriefingSection title="Why it exists">
          <p className="text-sm text-foreground/80">{sections.whyItExists}</p>
        </BriefingSection>

        <BriefingSection title="How it works">
          <p className="text-sm text-foreground/80">{sections.howItWorks}</p>
        </BriefingSection>

        <BriefingSection title="Who is affected">
          <p className="text-sm text-foreground/80">{sections.whoIsAffected}</p>
        </BriefingSection>

        {sections.dependencies.length > 0 && (
          <BriefingSection title="Dependencies">
            <div className="space-y-2">
              {sections.dependencies.map((dep, i) => (
                <div key={i} className="border-b border-border pb-2 last:border-0 last:pb-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{dep.name}</span>
                    <span className="text-xs text-muted-foreground">{dep.relationship}</span>
                  </div>
                  {dep.note && <p className="text-xs text-muted-foreground mt-0.5">{dep.note}</p>}
                </div>
              ))}
            </div>
          </BriefingSection>
        )}

        {sections.risks.length > 0 && (
          <BriefingSection title="Risks &amp; gotchas">
            {sections.risks.map((r, i) => (
              <RiskRow key={i} risk={r.risk} severity={r.severity} />
            ))}
          </BriefingSection>
        )}

        <BriefingSection title="Who to talk to">
          <p className="text-sm text-foreground/80">{sections.whoToTalkTo}</p>
        </BriefingSection>

        <BriefingSection title="Upcoming work">
          <p className="text-sm text-foreground/80">{sections.upcomingWork}</p>
        </BriefingSection>

        {sections.glossary.length > 0 && (
          <BriefingSection title="Glossary">
            <dl className="space-y-2">
              {sections.glossary.map((g, i) => (
                <div key={i}>
                  <dt className="text-sm font-medium">{g.term}</dt>
                  <dd className="text-sm text-muted-foreground">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </BriefingSection>
        )}
      </div>
    </div>
  )
}
