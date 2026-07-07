import type { EvidenceBundle } from '@/types'
import { extractKeywords } from './keywords'
import { gatherGitEvidence } from './git'
import { gatherAtlassianEvidence } from './atlassian'

export async function gatherEvidence(question: string): Promise<EvidenceBundle> {
  const keywords = extractKeywords(question)

  const [git, atlassian] = await Promise.all([gatherGitEvidence(keywords), gatherAtlassianEvidence(keywords)])

  return { keywords, git, jira: atlassian.jira, confluence: atlassian.confluence }
}
