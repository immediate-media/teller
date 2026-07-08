import type { FollowUpContext } from '@/types'
import { renderEvidence } from './evidenceRendering'

export const FOLLOWUP_SYSTEM_PROMPT = `You are Project Teller, helping a user dig deeper into a "who to talk to" result.

Rules — follow without exception:
- Answer in plain text only. No markdown, no bullet points, no numbered lists, no bold, no headers.
- Maximum 3 sentences per answer. If you cannot cover it in 3 sentences, answer only the most important part.
- Only report facts you retrieved directly from a tool call. If a tool returns nothing useful, say so in one sentence.
- Never hedge. Do not use "might", "could", "possibly", "it seems", "it appears". State what you found or say you couldn't confirm it.
- Do not recap the original question or the initial result — the user already has it.
- Cite identifiers inline so the user can verify (e.g. "FAB2-123 is assigned to Jane Smith" or "the Confluence page 'Stitcher Setup' was last edited by Ross").`

export function buildFollowUpContextPrompt(context: FollowUpContext): string {
  const parts: string[] = []

  parts.push(`## Original question\n\n${context.question}\n`)
  parts.push(`## Original answer\n\n${context.result.summary}\n`)

  if (context.result.makers.length > 0) {
    parts.push('Makers given (who originally built this):')
    for (const c of context.result.makers) {
      parts.push(`- ${c.name} (${c.confidence} confidence): ${c.rationale}`)
      for (const e of c.evidence) parts.push(`  - ${e}`)
    }
    parts.push('')
  }

  if (context.result.maintainers.length > 0) {
    parts.push('Maintainers given (who works on this recently):')
    for (const c of context.result.maintainers) {
      parts.push(`- ${c.name} (${c.confidence} confidence): ${c.rationale}`)
      for (const e of c.evidence) parts.push(`  - ${e}`)
    }
    parts.push('')
  }

  parts.push(renderEvidence(context.evidence))
  parts.push('---\n')
  parts.push('The user will now ask follow-up questions. Use your tools to dig deeper as needed. Only include results with high confidence. Omit anything you cannot verify.')

  return parts.join('\n')
}
