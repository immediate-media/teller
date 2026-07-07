import type { EvidenceBundle } from '@/types'

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

export function recencyLabel(dateStr: string): string {
  const days = daysAgo(dateStr)
  if (Number.isNaN(days)) return 'date unknown'
  if (days < 0) return 'just now'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${(days / 365).toFixed(1)}y ago`
}

export function renderEvidence(evidence: EvidenceBundle): string {
  const parts: string[] = []

  parts.push('## Git commit history\n')
  if (evidence.git.status === 'ok') {
    if (evidence.git.items.length === 0) {
      parts.push('No matching commits found.\n')
    } else {
      for (const item of evidence.git.items) {
        parts.push(
          `- ${item.authorName} <${item.authorEmail}> — ${item.commitCount} matching commit(s) in ${item.repo}; first ${recencyLabel(item.firstCommitDate)} (${item.firstCommitDate}), most recent ${recencyLabel(item.lastCommitDate)} (${item.lastCommitDate}) (matched on: ${item.matchedOn.join(', ')}). Sample subjects: ${item.sampleSubjects.map((s) => `"${s}"`).join('; ')}`,
        )
      }
    }
    parts.push(`(Scanned ${evidence.git.reposScanned} repo(s), skipped ${evidence.git.reposSkipped}.)\n`)
  } else {
    parts.push(`Unavailable (${evidence.git.error ?? evidence.git.status}).\n`)
  }

  parts.push('## Jira issues\n')
  if (evidence.jira.status === 'ok') {
    if (evidence.jira.items.length === 0) {
      parts.push('No matching issues found.\n')
    } else {
      for (const item of evidence.jira.items) {
        parts.push(
          `- ${item.key}: "${item.summary}" (status: ${item.status}, assignee: ${item.assignee ?? 'none'}, reporter: ${item.reporter ?? 'none'}, updated ${recencyLabel(item.updated)}, ${item.url})`,
        )
      }
    }
    parts.push('')
  } else {
    parts.push(`Unavailable (${evidence.jira.error ?? evidence.jira.status}).\n`)
  }

  parts.push('## Confluence pages\n')
  if (evidence.confluence.status === 'ok') {
    if (evidence.confluence.items.length === 0) {
      parts.push('No matching pages found.\n')
    } else {
      for (const item of evidence.confluence.items) {
        const modified = item.lastModified ? recencyLabel(item.lastModified) : 'unknown'
        parts.push(
          `- "${item.title}" (space: ${item.spaceKey ?? 'unknown'}, last edited by: ${item.author ?? 'unknown'}, last modified ${modified}, ${item.url})`,
        )
      }
    }
    parts.push('')
  } else {
    parts.push(`Unavailable (${evidence.confluence.error ?? evidence.confluence.status}).\n`)
  }

  return parts.join('\n')
}
