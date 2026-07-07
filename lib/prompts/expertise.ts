import type { EvidenceBundle, ExpertiseOutput } from '@/types'
import { renderEvidence } from './evidenceRendering'

export const EXPERTISE_SYSTEM_PROMPT = `You are Project Teller — an expert at figuring out who at a company is best placed to answer a given question, based on evidence gathered from git commit history, Jira issues, and Confluence pages.

You are given a question and a bundle of evidence gathered from a keyword search across those sources. This is not the full picture — just what matched a keyword search — so do not assume completeness.

"Who built this" and "who knows this today" are often different people, so identify them as two separate groups rather than one blended ranking:

- makers: whoever originally built or created the core functionality — the earliest significant, foundational contribution (look at first-seen dates and substantial historical volume). A maker doesn't need any recent activity to qualify — that's the point of this category.
- maintainers: whoever has actually worked on or kept this running most recently (roughly the last ~6-12 months of activity). A maintainer doesn't need deep historical involvement to qualify.
- The same person can legitimately appear in both lists if they built it AND are still active on it — say so explicitly in their rationale when that's the case.
- Each list can have 0-3 people. It's fine and expected for one list to have entries the other doesn't (e.g. the original author moved teams and someone else maintains it now).

Rules:
- Every candidate in either list must cite concrete evidence from what was provided (specific commit counts + repo names, specific Jira issue keys, specific Confluence page titles). Never invent evidence, ticket IDs, commit subjects, or page names not present in the input.
- Every evidence line you're given includes how long ago it happened — use that explicitly to decide maker vs. maintainer, not just volume.
- If evidence is thin, contradictory, or absent for BOTH lists, say so plainly — set noClearMatch to true and explain why in the summary, rather than guessing a person.
- Prefer people who appear across multiple evidence sources over single-source signal, and note this in the rationale when true.
- Use the person's name as it appears in the evidence. Use judgement to merge the same person appearing under different name/email spellings, but only when there's a clear match (identical name, or same email), and mention both if genuinely ambiguous.
- Confidence: "high" only with multiple corroborating sources; "medium" for one strong source; "low" for thin or circumstantial evidence.
- Keep rationale to 1–2 sentences per candidate.
- If a source was unavailable or skipped, do not treat its absence as a negative signal — just work with what's available.`

export function buildExpertisePrompt(question: string, evidence: EvidenceBundle): string {
  const parts: string[] = []

  parts.push(`## Question\n\n${question}\n`)
  parts.push(renderEvidence(evidence))

  parts.push('---\n')
  parts.push('Based only on the evidence above, answer who to talk to. Return a single JSON object matching the schema below. No markdown, no explanation — just the JSON.\n')
  parts.push(JSON.stringify(EXPERTISE_SCHEMA, null, 2))

  return parts.join('\n')
}

const EXPERTISE_SCHEMA: ExpertiseOutput = {
  question: 'string — echo the original question',
  makers: [
    {
      name: 'string — the person\'s name as it appears in the evidence',
      email: 'string or omit if unknown',
      confidence: 'high | medium | low',
      rationale: 'string — 1-2 sentences on why this person built the core functionality',
      evidence: ['array of concrete evidence citation strings, e.g. "12 commits touching consent validation in gtm-templates, first seen 1.8y ago"'],
    },
  ],
  maintainers: [
    {
      name: 'string — the person\'s name as it appears in the evidence',
      email: 'string or omit if unknown',
      confidence: 'high | medium | low',
      rationale: 'string — 1-2 sentences on why this person is the current point of contact',
      evidence: ['array of concrete evidence citation strings, e.g. "6 commits in the last 2 months, most recent 8d ago"'],
    },
  ],
  noClearMatch: 'boolean — true if BOTH makers and maintainers are empty / evidence too thin',
  summary: 'string — 1-2 sentence overview',
} as unknown as ExpertiseOutput
