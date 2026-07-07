import type { EvidenceBundle } from '@/types'
import { extractKeywords } from './keywords'
import { gatherGitEvidence } from './git'
import { gatherAtlassianEvidence } from './atlassian'

export async function gatherEvidence(
  question: string,
  onProgress?: (message: string) => void,
): Promise<EvidenceBundle> {
  const keywords = extractKeywords(question)

  onProgress?.('Searching git history…')
  const gitPromise = gatherGitEvidence(keywords)
  const atlassianPromise = gatherAtlassianEvidence(keywords)

  // Await git first (25s deadline — finishes before Atlassian in most cases)
  // then signal the Atlassian step while it's still running
  const git = await gitPromise
  onProgress?.('Searching Jira and Confluence…')
  const atlassian = await atlassianPromise

  return { keywords, git, jira: atlassian.jira, confluence: atlassian.confluence }
}
