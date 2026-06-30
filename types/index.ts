export type BriefingStatus = 'live' | 'in-review' | 'in-progress' | 'deprecated'

export type BriefingOutput = {
  projectName: string
  oneLiner: string
  sections: {
    summary: string
    whyItExists: string
    currentState: {
      status: BriefingStatus
      version?: string
      notes: string
      tickets?: string[]
    }
    howItWorks: string
    dependencies: { name: string; relationship: string; note?: string }[]
    whoIsAffected: string
    risks: { risk: string; severity: 'high' | 'medium' | 'low' }[]
    whoToTalkTo: string
    upcomingWork: string
    glossary: { term: string; definition: string }[]
  }
}

export type AnalyzeRequest = {
  repoPath: string
  confluenceUrls?: string[]
}

export type AnalyzeResponse =
  | { ok: true; briefing: BriefingOutput }
  | { ok: false; error: string }
