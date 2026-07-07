import type { ExpertiseCandidate } from '@/types'
import { BriefingSection } from '@/components/briefing/BriefingSection'

const CONFIDENCE_CONFIG: Record<ExpertiseCandidate['confidence'], { label: string; className: string }> = {
  high: { label: 'High confidence', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Medium confidence', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low confidence', className: 'bg-muted text-muted-foreground border-border' },
}

type Props = {
  rank: number
  candidate: ExpertiseCandidate
}

export function CandidateCard({ rank, candidate }: Props) {
  const confidence = CONFIDENCE_CONFIG[candidate.confidence]

  return (
    <BriefingSection title={`#${rank} — ${candidate.name}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${confidence.className}`}>
          {confidence.label}
        </span>
        {candidate.email && <span className="text-xs text-zinc-500 font-mono">{candidate.email}</span>}
      </div>
      <p className="text-sm text-foreground/80 mb-3">{candidate.rationale}</p>
      {candidate.evidence.length > 0 && (
        <ul className="space-y-1 list-disc list-inside">
          {candidate.evidence.map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
      )}
    </BriefingSection>
  )
}
