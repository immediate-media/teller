import type { EvidenceBundle } from '@/types'
import { gatherJiraEvidence } from './jira'
import { gatherConfluenceEvidence } from './confluence'

type AtlassianEvidence = { jira: EvidenceBundle['jira']; confluence: EvidenceBundle['confluence'] }

export async function gatherAtlassianEvidence(keywords: string[]): Promise<AtlassianEvidence> {
  const [jira, confluence] = await Promise.all([
    gatherJiraEvidence(keywords),
    gatherConfluenceEvidence(keywords),
  ])
  return { jira, confluence }
}

