import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { runClaudeTool } from '@/lib/runClaudeTool'
import { buildAtlassianMcpConfig } from './mcpConfig'
import type { ConfluenceEvidenceItem, EvidenceBundle, JiraEvidenceItem } from '@/types'

const TIMEOUT_MS = 180_000
const ALLOWED_TOOLS = 'mcp__mcp-atlassian__jira_search mcp__mcp-atlassian__confluence_search'
const RELEVANCE_LIMIT = 8
const RECENCY_LIMIT = 5
const MAX_KEYWORDS = 3

type AtlassianEvidence = { jira: EvidenceBundle['jira']; confluence: EvidenceBundle['confluence'] }
type RawAtlassianResult = { jira: JiraEvidenceItem[]; confluence: ConfluenceEvidenceItem[] }

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    jira: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          summary: { type: 'string' },
          status: { type: 'string' },
          assignee: { type: ['string', 'null'] },
          reporter: { type: ['string', 'null'] },
          url: { type: 'string' },
          updated: { type: 'string' },
        },
        required: ['key', 'summary', 'status', 'url', 'updated'],
      },
    },
    confluence: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          spaceKey: { type: ['string', 'null'] },
          author: { type: ['string', 'null'] },
          url: { type: 'string' },
          lastModified: { type: ['string', 'null'] },
        },
        required: ['id', 'title', 'url'],
      },
    },
  },
  required: ['jira', 'confluence'],
}

function buildPrompt(keywords: string[]): string {
  const clause = keywords
    .slice(0, MAX_KEYWORDS)
    .map((kw) => `text ~ "${kw.replace(/"/g, '')}"`)
    .join(' OR ')
  return `Relevance and recency both matter, so run each search twice and merge the results:

Jira:
1. jira_search with JQL: ${clause} (maxResults ${RELEVANCE_LIMIT}) — no ORDER BY, so results come back ranked by Jira's default text-relevance score.
2. jira_search with JQL: ${clause} ORDER BY updated DESC (maxResults ${RECENCY_LIMIT}) — to also catch recently-touched matches that may rank lower on relevance.
Merge both result sets, de-duplicating by issue key.

Confluence:
1. confluence_search with CQL: (${clause}) (limit ${RELEVANCE_LIMIT}) — no explicit order by, so results come back ranked by relevance.
2. confluence_search with CQL: (${clause}) order by lastmodified desc (limit ${RECENCY_LIMIT}) — to also catch recently-edited matches.
Merge both result sets, de-duplicating by page id.

Populate every field from the tool results where available; use null for any field the tools didn't return. Only report data the tools actually returned — do not invent issues or pages. If a search returns no results, use an empty array for that key.`
}

export async function gatherAtlassianEvidence(keywords: string[]): Promise<AtlassianEvidence> {
  const mcpConfig = buildAtlassianMcpConfig()
  if (!mcpConfig) {
    const skipped = { status: 'skipped' as const, items: [], error: 'Atlassian MCP not configured (missing env vars)' }
    return { jira: skipped, confluence: skipped }
  }

  if (keywords.length === 0) {
    return { jira: { status: 'ok', items: [] }, confluence: { status: 'ok', items: [] } }
  }

  const configPath = path.join(os.tmpdir(), `teller-mcp-${process.pid}-${Date.now()}.json`)
  await fs.writeFile(configPath, JSON.stringify(mcpConfig), { mode: 0o600 })

  try {
    const stdout = await runClaudeTool([
      '-p',
      '--mcp-config', configPath,
      '--strict-mcp-config',
      '--allowedTools', ALLOWED_TOOLS,
      '--permission-mode', 'default',
      '--output-format', 'json',
      '--json-schema', JSON.stringify(OUTPUT_SCHEMA),
      buildPrompt(keywords),
    ], TIMEOUT_MS)

    const envelope = JSON.parse(stdout) as { structured_output?: RawAtlassianResult; is_error?: boolean; result?: string }
    if (!envelope.structured_output) {
      throw new Error(envelope.result ?? 'No structured output returned')
    }

    return {
      jira: { status: 'ok', items: envelope.structured_output.jira ?? [] },
      confluence: { status: 'ok', items: envelope.structured_output.confluence ?? [] },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const errored = { status: 'error' as const, items: [], error: `Atlassian MCP search failed: ${message}` }
    return { jira: errored, confluence: errored }
  } finally {
    await fs.unlink(configPath).catch(() => {})
  }
}
