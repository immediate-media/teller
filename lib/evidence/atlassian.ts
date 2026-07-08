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


function buildPrompt(keywords: string[]): string {
  const clause = keywords
    .slice(0, MAX_KEYWORDS)
    .map((kw) => `text ~ "${kw.replace(/"/g, '')}"`)
    .join(' OR ')
  return `Execute these tool calls now. Do not ask for clarification — run all four searches immediately.

Jira (run both, then merge by issue key, dedup):
1. jira_search JQL: ${clause}  maxResults=${RELEVANCE_LIMIT}
2. jira_search JQL: ${clause} ORDER BY updated DESC  maxResults=${RECENCY_LIMIT}

Confluence (run both, then merge by page id, dedup):
1. confluence_search CQL: (${clause})  limit=${RELEVANCE_LIMIT}
2. confluence_search CQL: (${clause}) order by lastmodified desc  limit=${RECENCY_LIMIT}

After running all searches, respond with ONLY a JSON code block — no preamble, no explanation, no text outside the block:

\`\`\`json
{"jira": [...], "confluence": [...]}
\`\`\`

Use only data the tools returned. Populate fields where available, null for anything not returned. If a search has no results, use [].`
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
      '--permission-mode', 'bypassPermissions',
      '--output-format', 'json',
      buildPrompt(keywords),
    ], TIMEOUT_MS)

    const envelope = JSON.parse(stdout) as { is_error?: boolean; result?: string }
    // When is_error is true the "result" field holds Claude's error text — not useful data
    if (envelope.is_error) throw new Error('Claude CLI reported an error')
    if (!envelope.result) throw new Error('No result returned')

    // Claude returns the JSON inside a markdown code block — extract it
    const jsonMatch = envelope.result.match(/```(?:json)?\s*([\s\S]*?)```/) ?? envelope.result.match(/(\{[\s\S]*\})/)
    // No JSON block means Claude returned a narrative (e.g. "no results found") — treat as empty
    if (!jsonMatch) return { jira: { status: 'ok', items: [] }, confluence: { status: 'ok', items: [] } }
    const parsed = JSON.parse(jsonMatch[1].trim()) as RawAtlassianResult

    return {
      jira: { status: 'ok', items: parsed.jira ?? [] },
      confluence: { status: 'ok', items: parsed.confluence ?? [] },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const errored = { status: 'error' as const, items: [], error: `Atlassian MCP search failed: ${message}` }
    return { jira: errored, confluence: errored }
  } finally {
    await fs.unlink(configPath).catch(() => {})
  }
}
