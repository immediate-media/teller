import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 120
import { runClaude } from '@/lib/cli'
import { ingestRepo } from '@/lib/ingest'
import { buildPmPrompt, PM_SYSTEM_PROMPT } from '@/lib/prompts/pm'
import type { AnalyzeRequest, AnalyzeResponse, BriefingOutput } from '@/types'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AnalyzeRequest
  const { repoPath } = body

  if (!repoPath?.trim()) {
    return NextResponse.json<AnalyzeResponse>(
      { ok: false, error: 'A repository path is required.' },
      { status: 400 },
    )
  }

  // Ingest repo files (README gate + PM filter + token cap happen here)
  const ingest = ingestRepo(repoPath.trim())
  if (!ingest.ok) {
    return NextResponse.json<AnalyzeResponse>({ ok: false, error: ingest.error }, { status: 422 })
  }

  const userPrompt = buildPmPrompt(ingest.files)

  let raw: string
  try {
    raw = await runClaude(PM_SYSTEM_PROMPT, userPrompt)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error from Claude CLI'
    return NextResponse.json<AnalyzeResponse>({ ok: false, error: message }, { status: 500 })
  }

  let briefing: BriefingOutput
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    briefing = JSON.parse(cleaned)
  } catch {
    return NextResponse.json<AnalyzeResponse>(
      { ok: false, error: 'Could not parse Claude response as JSON.' },
      { status: 500 },
    )
  }

  return NextResponse.json<AnalyzeResponse>({ ok: true, briefing })
}
