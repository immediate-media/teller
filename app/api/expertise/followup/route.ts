import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { runClaudeTool } from '@/lib/runClaudeTool'
import { buildAtlassianMcpConfig } from '@/lib/evidence/mcpConfig'
import { FOLLOWUP_SYSTEM_PROMPT, buildFollowUpContextPrompt } from '@/lib/prompts/followup'
import type { FollowUpRequest, FollowUpResponse } from '@/types'

export const maxDuration = 180

const TIMEOUT_MS = 120_000
const ALLOWED_TOOLS = [
  'mcp__mcp-atlassian__jira_search',
  'mcp__mcp-atlassian__jira_get_issue',
  'mcp__mcp-atlassian__jira_get_issue_development_info',
  'mcp__mcp-atlassian__confluence_search',
  'mcp__mcp-atlassian__confluence_get_page',
  'mcp__mcp-atlassian__confluence_get_page_children',
].join(' ')

export async function POST(req: NextRequest) {
  const body = (await req.json()) as FollowUpRequest
  const question = body.question?.trim()

  if (!question) {
    return NextResponse.json({ ok: false, error: 'A question is required.' } satisfies FollowUpResponse, { status: 400 })
  }

  const mcpConfig = buildAtlassianMcpConfig()
  if (!mcpConfig) {
    return NextResponse.json(
      { ok: false, error: 'Atlassian MCP not configured (missing env vars in .env.local).' } satisfies FollowUpResponse,
      { status: 422 },
    )
  }

  const isNewThread = !body.sessionId
  if (isNewThread && !body.context) {
    return NextResponse.json({ ok: false, error: 'Missing context for a new follow-up thread.' } satisfies FollowUpResponse, { status: 400 })
  }

  const configPath = path.join(os.tmpdir(), `teller-followup-mcp-${process.pid}-${Date.now()}.json`)
  await fs.writeFile(configPath, JSON.stringify(mcpConfig), { mode: 0o600 })

  const args = [
    '-p',
    '--mcp-config', configPath,
    '--strict-mcp-config',
    '--allowedTools', ALLOWED_TOOLS,
    '--permission-mode', 'bypassPermissions',
    '--output-format', 'json',
  ]

  const sessionId = body.sessionId ?? randomUUID()

  if (isNewThread) {
    args.push('--session-id', sessionId, '--append-system-prompt', FOLLOWUP_SYSTEM_PROMPT)
    args.push(`${buildFollowUpContextPrompt(body.context!)}\n\n## Follow-up question\n\n${question}`)
  } else {
    args.push('--resume', sessionId)
    args.push(question)
  }

  try {
    const stdout = await runClaudeTool(args, TIMEOUT_MS)
    const envelope = JSON.parse(stdout) as { result?: string; is_error?: boolean; session_id?: string }

    if (envelope.is_error || !envelope.result) {
      return NextResponse.json({ ok: false, error: envelope.result ?? 'No answer returned.' } satisfies FollowUpResponse, { status: 502 })
    }

    return NextResponse.json({ ok: true, sessionId: envelope.session_id ?? sessionId, answer: envelope.result } satisfies FollowUpResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: `Follow-up failed: ${message}` } satisfies FollowUpResponse, { status: 502 })
  } finally {
    await fs.unlink(configPath).catch(() => {})
  }
}
