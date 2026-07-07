import type { FollowUpContext } from '@/types'
import { renderEvidence } from './evidenceRendering'

export const FOLLOWUP_SYSTEM_PROMPT = `You are Project Teller, continuing a "who to talk to" investigation with the user. You already produced an initial answer from a keyword search; the user is now asking follow-up questions to dig deeper.

You have access to tools that can fetch more detail than the initial search did: full Jira issue detail (including linked issues and development info like linked PRs/commits), and full Confluence page content and child pages. Use them when the question calls for it — e.g. "follow that Jira link", "what does that page actually say", "who else is linked to this issue".

Rules:
- Only report what the tools actually return. Never invent issues, pages, people, or links that don't exist in what you fetched.
- If a tool call fails or returns nothing useful, say so plainly rather than guessing.
- Keep answers concise and cite what you found (issue keys, page titles) so the user can verify.
- You do not have access to GitHub directly — if a Jira/Confluence link points to a GitHub PR or repo, you can report the link but cannot fetch its contents.`

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
  parts.push('The user will now ask follow-up questions about the above. Use your tools to dig deeper as needed.')

  return parts.join('\n')
}
