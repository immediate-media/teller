import type { BriefingOutput } from '@/types'

export const PM_SYSTEM_PROMPT = `You are Project Teller — an expert at reading codebases and producing clear, concise briefings for product managers.

You will be given the contents of a project (documentation files and config) and your job is to produce a structured PM briefing. The PM is not technical — avoid implementation details, focus on what the project does, why it exists, and what a PM needs to know to work with it effectively.

Rules:
- Keep each section to 100–150 words maximum. Be specific, not exhaustive.
- If you cannot confidently answer a section from the provided files, say "Not clear from available docs" rather than guessing.
- Surface risks and gotchas that would genuinely catch a PM off-guard.
- For the glossary, only include terms a PM would actually need — skip obvious tech jargon.
- For tickets in currentState, only include IDs you can see in the files (e.g. FAB2-167). Do not invent ticket references.
- Status should be one of: live, in-review, in-progress, deprecated.`

export function buildPmPrompt(
  files: { path: string; content: string; truncated: boolean }[],
  confluenceContent?: string,
): string {
  const parts: string[] = []

  parts.push('## Project files\n')
  for (const file of files) {
    parts.push(`### ${file.path}${file.truncated ? ' (truncated)' : ''}\n`)
    parts.push(file.content)
    parts.push('\n')
  }

  if (confluenceContent) {
    parts.push('## Confluence documentation\n')
    parts.push(confluenceContent)
    parts.push('\n')
  }

  parts.push('---\n')
  parts.push('Produce a PM briefing for this project. Return a single JSON object matching the schema below. No markdown, no explanation — just the JSON.\n')
  parts.push(JSON.stringify(BRIEFING_SCHEMA, null, 2))

  return parts.join('\n')
}

const BRIEFING_SCHEMA: BriefingOutput = {
  projectName: 'string',
  oneLiner: 'string — one sentence describing what the project does',
  sections: {
    summary: 'string — 100-150 words. What is this project and what does it do?',
    whyItExists: 'string — 100-150 words. What problem does it solve? What would break without it?',
    currentState: {
      status: 'live | in-review | in-progress | deprecated',
      version: 'string or omit if unknown',
      notes: 'string — current state, recent changes, anything notable',
      tickets: ['array of Jira ticket IDs visible in the docs, or omit'],
    },
    howItWorks: 'string — 100-150 words. Non-technical explanation of the mechanism.',
    dependencies: [
      {
        name: 'string — name of the dependency or system',
        relationship: 'string — what role it plays',
        note: 'string or omit — any gotcha or caveat',
      },
    ],
    whoIsAffected: 'string — 100-150 words. Which teams, users, or systems are affected by this project?',
    risks: [
      {
        risk: 'string — the specific risk or gotcha',
        severity: 'high | medium | low',
      },
    ],
    whoToTalkTo: 'string — 100-150 words. Who owns this? Who should a PM speak to?',
    upcomingWork: 'string — 100-150 words. Known upcoming work, open decisions, or unknowns.',
    glossary: [
      {
        term: 'string — the term',
        definition: 'string — plain-English definition for a PM',
      },
    ],
  },
} as unknown as BriefingOutput
