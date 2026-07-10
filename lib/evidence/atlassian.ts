import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { runClaudeTool } from '@/lib/runClaudeTool'
import { buildAtlassianMcpConfig } from './mcpConfig'
import type { ConfluenceEvidenceItem, EvidenceBundle, JiraEvidenceItem } from '@/types'

const TIMEOUT_MS = 180_000
const RELEVANCE_LIMIT = 8
const RECENCY_LIMIT = 5
const MAX_KEYWORDS = 3

type AtlassianEvidence = { jira: EvidenceBundle['jira']; confluence: EvidenceBundle['confluence'] }

function buildSearchClause(keywords: string[]): string {
  return keywords
    .slice(0, MAX_KEYWORDS)
    .map((kw) => `text ~ "${kw.replace(/"/g, '')}"`)
    .join(' OR ')
}

function buildJiraPrompt(clause: string): string {
  return `Execute these tool calls now. Do not ask for clarification — run both searches immediately.

Jira (run both, then merge by issue key, dedup):
1. jira_search JQL: ${clause}  maxResults=${RELEVANCE_LIMIT}
2. jira_search JQL: ${clause} ORDER BY updated DESC  maxResults=${RECENCY_LIMIT}

After running both searches, respond with ONLY a JSON code block — no preamble, no explanation, no text outside the block:

\`\`\`json
{"jira": [...]}
\`\`\`

Use only data the tools returned. Populate fields where available, null for anything not returned. If searches have no results, use [].`
}

function buildConfluencePrompt(clause: string): string {
  return `Execute these tool calls now. Do not ask for clarification — run both searches immediately.

Confluence (run both, then merge by page id, dedup):
1. confluence_search CQL: (${clause})  limit=${RELEVANCE_LIMIT}
2. confluence_search CQL: (${clause}) order by lastmodified desc  limit=${RECENCY_LIMIT}

After running both searches, respond with ONLY a JSON code block — no preamble, no explanation, no text outside the block:

\`\`\`json
{"confluence": [...]}
\`\`\`

Use only data the tools returned. Populate fields where available, null for anything not returned. If searches have no results, use [].`
}

function extractJson<T>(stdout: string): T | null {
  const envelope = JSON.parse(stdout) as { is_error?: boolean; result?: string }
  if (envelope.is_error) throw new Error('Claude CLI reported an error')
  if (!envelope.result) throw new Error('No result returned')
  const jsonMatch = envelope.result.match(/```(?:json)?\s*([\s\S]*?)```/) ?? envelope.result.match(/(\{[\s\S]*\})/)
  if (!jsonMatch) return null
  return JSON.parse(jsonMatch[1].trim()) as T
}

async function runJiraSearch(keywords: string[], configPath: string): Promise<EvidenceBundle['jira']> {
  try {
    const stdout = await runClaudeTool([
      '-p',
      '--mcp-config', configPath,
      '--strict-mcp-config',
      '--allowedTools', 'mcp__mcp-atlassian__jira_search',
      '--permission-mode', 'bypassPermissions',
      '--output-format', 'json',
      buildJiraPrompt(buildSearchClause(keywords)),
    ], TIMEOUT_MS)
    const parsed = extractJson<{ jira: JiraEvidenceItem[] }>(stdout)
    return { status: 'ok', items: parsed?.jira ?? [] }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'error', items: [], error: `Jira search failed: ${message}` }
  }
}

async function runConfluenceSearch(keywords: string[], configPath: string): Promise<EvidenceBundle['confluence']> {
  try {
    const stdout = await runClaudeTool([
      '-p',
      '--mcp-config', configPath,
      '--strict-mcp-config',
      '--allowedTools', 'mcp__mcp-atlassian__confluence_search',
      '--permission-mode', 'bypassPermissions',
      '--output-format', 'json',
      buildConfluencePrompt(buildSearchClause(keywords)),
    ], TIMEOUT_MS)
    const parsed = extractJson<{ confluence: ConfluenceEvidenceItem[] }>(stdout)
    return { status: 'ok', items: parsed?.confluence ?? [] }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'error', items: [], error: `Confluence search failed: ${message}` }
  }
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
    // Run Jira and Confluence searches in parallel — two independent Claude CLI processes
    const [jira, confluence] = await Promise.all([
      runJiraSearch(keywords, configPath),
      runConfluenceSearch(keywords, configPath),
    ])
    return { jira, confluence }
  } finally {
    await fs.unlink(configPath).catch(() => {})
  }
}
