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

export type BriefingContributor = {
  name: string
  email?: string
  commitCount: number
  firstCommitDate: string
  lastCommitDate: string
}

export type BriefingMeta = {
  owner: BriefingContributor | null
  recentContributors: BriefingContributor[]
  repoName: string
}

export type AnalyzeResponse =
  | { ok: true; briefing: BriefingOutput; meta: BriefingMeta }
  | { ok: false; error: string }

// --- Who to talk to ---

export type ExpertiseRequest = {
  question: string
}

export type EvidenceSourceStatus = 'ok' | 'error' | 'skipped'

export type GitEvidenceItem = {
  repo: string
  authorName: string
  authorEmail: string
  commitCount: number
  firstCommitDate: string
  lastCommitDate: string
  sampleSubjects: string[]
  matchedOn: ('message' | 'content' | 'path')[]
}

export type JiraEvidenceItem = {
  key: string
  summary: string
  status: string
  assignee?: string
  reporter?: string
  url: string
  updated: string
}

export type ConfluenceEvidenceItem = {
  id: string
  title: string
  spaceKey?: string
  author?: string
  url: string
  lastModified?: string
}

export type EvidenceBundle = {
  keywords: string[]
  git: { status: EvidenceSourceStatus; items: GitEvidenceItem[]; error?: string; reposScanned: number; reposSkipped: number }
  jira: { status: EvidenceSourceStatus; items: JiraEvidenceItem[]; error?: string }
  confluence: { status: EvidenceSourceStatus; items: ConfluenceEvidenceItem[]; error?: string }
}

export type ExpertiseCandidate = {
  name: string
  email?: string
  confidence: 'high' | 'medium' | 'low'
  rationale: string
  evidence: string[]
}

export type ExpertiseOutput = {
  question: string
  makers: ExpertiseCandidate[]
  maintainers: ExpertiseCandidate[]
  noClearMatch: boolean
  summary: string
}

export type ExpertiseResponse =
  | { ok: true; result: ExpertiseOutput; evidence: EvidenceBundle }
  | { ok: false; error: string }

// --- Follow-up thread ---

export type FollowUpContext = {
  question: string
  result: ExpertiseOutput
  evidence: EvidenceBundle
}

export type FollowUpRequest = {
  sessionId?: string
  question: string
  context?: FollowUpContext
}

export type FollowUpResponse =
  | { ok: true; sessionId: string; answer: string }
  | { ok: false; error: string }
