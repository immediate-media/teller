import type { ExpertiseCandidate } from '@/types'
import { BriefingSection } from '@/components/briefing/BriefingSection'

const CONFIDENCE_CONFIG: Record<ExpertiseCandidate['confidence'], { label: string; className: string }> = {
  high: { label: 'High confidence', className: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
  medium: { label: 'Medium confidence', className: 'bg-amber-950 text-amber-400 border-amber-800' },
  low: { label: 'Low confidence', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
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
      <p className="text-sm text-zinc-300 mb-3">{candidate.rationale}</p>
      {candidate.evidence.length > 0 && (
        <ul className="space-y-1 list-disc list-inside">
          {candidate.evidence.map((item, i) => (
            <li key={i} className="text-xs text-zinc-400">
              {item}
            </li>
          ))}
        </ul>
      )}
    </BriefingSection>
  )
}
