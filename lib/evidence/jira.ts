import { MOCK_JIRA_ITEMS } from '@/lib/mock/fixtures'
import type { EvidenceBundle, JiraEvidenceItem } from '@/types'

const RELEVANCE_LIMIT = 8
const RECENCY_LIMIT = 5
const MAX_KEYWORDS = 3

type JiraIssue = {
  key: string
  fields: {
    summary: string
    status: { name: string }
    assignee?: { displayName: string }
    reporter?: { displayName: string }
    updated: string
  }
}

type JiraSearchResponse = {
  issues: JiraIssue[]
}

function buildJiraUrl(): string {
  const url = process.env.JIRA_URL ?? ''
  return url.replace(/\/$/, '')
}

function buildAuthHeader(): string {
  const credentials = `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

async function searchJira(jql: string, maxResults: number, auth: string, baseUrl: string): Promise<JiraIssue[]> {
  const params = new URLSearchParams({
    jql,
    maxResults: String(maxResults),
    fields: 'summary,status,assignee,reporter,updated',
  })
  const res = await fetch(`${baseUrl}/rest/api/3/search?${params}`, {
    headers: { Authorization: auth, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Jira API returned ${res.status}`)
  const data = (await res.json()) as JiraSearchResponse
  return data.issues ?? []
}

function mapIssue(issue: JiraIssue, baseUrl: string): JiraEvidenceItem {
  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    assignee: issue.fields.assignee?.displayName,
    reporter: issue.fields.reporter?.displayName,
    url: `${baseUrl}/browse/${issue.key}`,
    updated: issue.fields.updated,
  }
}

export async function gatherJiraEvidence(keywords: string[]): Promise<EvidenceBundle['jira']> {
  if (process.env.TELLER_MOCK === 'true') {
    return { status: 'ok', items: MOCK_JIRA_ITEMS }
  }

  if (!process.env.JIRA_URL || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
    return { status: 'skipped', items: [], error: 'Jira credentials not configured' }
  }

  if (keywords.length === 0) return { status: 'ok', items: [] }

  try {
    const baseUrl = buildJiraUrl()
    const auth = buildAuthHeader()
    const clause = keywords
      .slice(0, MAX_KEYWORDS)
      .map((kw) => `text ~ "${kw.replace(/"/g, '')}"`)
      .join(' OR ')

    const [relevance, recency] = await Promise.all([
      searchJira(clause, RELEVANCE_LIMIT, auth, baseUrl),
      searchJira(`${clause} ORDER BY updated DESC`, RECENCY_LIMIT, auth, baseUrl),
    ])

    // Merge by issue key, dedup
    const seen = new Map<string, JiraEvidenceItem>()
    for (const issue of [...relevance, ...recency]) {
      if (!seen.has(issue.key)) seen.set(issue.key, mapIssue(issue, baseUrl))
    }

    return { status: 'ok', items: Array.from(seen.values()) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'error', items: [], error: `Jira search failed: ${message}` }
  }
}
