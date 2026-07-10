import { MOCK_CONFLUENCE_ITEMS } from '@/lib/mock/fixtures'
import type { ConfluenceEvidenceItem, EvidenceBundle } from '@/types'

const RELEVANCE_LIMIT = 8
const RECENCY_LIMIT = 5
const MAX_KEYWORDS = 3

type ConfluencePage = {
  id: string
  title: string
  space?: { key: string }
  history?: {
    createdBy?: { displayName: string }
    lastUpdated?: { when: string }
  }
  _links?: { webui?: string }
}

type ConfluenceSearchResponse = {
  results: ConfluencePage[]
}

function buildConfluenceBase(): string {
  const url = (process.env.CONFLUENCE_URL ?? '').replace(/\/$/, '')
  // Normalise: ensure base does not include /wiki (we append it for API calls)
  return url.replace(/\/wiki$/, '')
}

function buildAuthHeader(): string {
  const credentials = `${process.env.CONFLUENCE_USERNAME}:${process.env.CONFLUENCE_API_TOKEN}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

async function searchConfluence(cql: string, limit: number, auth: string, baseUrl: string): Promise<ConfluencePage[]> {
  const params = new URLSearchParams({
    cql,
    limit: String(limit),
    expand: 'history,space,history.lastUpdated',
  })
  const res = await fetch(`${baseUrl}/wiki/rest/api/content/search?${params}`, {
    headers: { Authorization: auth, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Confluence API returned ${res.status}`)
  const data = (await res.json()) as ConfluenceSearchResponse
  return data.results ?? []
}

function mapPage(page: ConfluencePage, baseUrl: string): ConfluenceEvidenceItem {
  const webui = page._links?.webui ?? ''
  return {
    id: page.id,
    title: page.title,
    spaceKey: page.space?.key,
    author: page.history?.createdBy?.displayName,
    url: `${baseUrl}/wiki${webui}`,
    lastModified: page.history?.lastUpdated?.when,
  }
}

export async function gatherConfluenceEvidence(keywords: string[]): Promise<EvidenceBundle['confluence']> {
  if (process.env.TELLER_MOCK === 'true') {
    return { status: 'ok', items: MOCK_CONFLUENCE_ITEMS }
  }

  if (!process.env.CONFLUENCE_URL || !process.env.CONFLUENCE_USERNAME || !process.env.CONFLUENCE_API_TOKEN) {
    return { status: 'skipped', items: [], error: 'Confluence credentials not configured' }
  }

  if (keywords.length === 0) return { status: 'ok', items: [] }

  try {
    const baseUrl = buildConfluenceBase()
    const auth = buildAuthHeader()
    const clause = keywords
      .slice(0, MAX_KEYWORDS)
      .map((kw) => `text ~ "${kw.replace(/"/g, '')}"`)
      .join(' OR ')

    const [relevance, recency] = await Promise.all([
      searchConfluence(`(${clause})`, RELEVANCE_LIMIT, auth, baseUrl),
      searchConfluence(`(${clause}) order by lastmodified desc`, RECENCY_LIMIT, auth, baseUrl),
    ])

    // Merge by page id, dedup
    const seen = new Map<string, ConfluenceEvidenceItem>()
    for (const page of [...relevance, ...recency]) {
      if (!seen.has(page.id)) seen.set(page.id, mapPage(page, baseUrl))
    }

    return { status: 'ok', items: Array.from(seen.values()) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'error', items: [], error: `Confluence search failed: ${message}` }
  }
}
