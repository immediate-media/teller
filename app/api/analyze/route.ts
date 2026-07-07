import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude'
import { ingestRepo } from '@/lib/ingest'
import { analyzeContributors } from '@/lib/ingest/contributors'
import { buildPmPrompt, PM_SYSTEM_PROMPT } from '@/lib/prompts/pm'
import { parseClaudeJsonOutput } from '@/lib/parseClaudeJson'
import type { AnalyzeRequest, BriefingMeta, BriefingOutput } from '@/types'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AnalyzeRequest
  const { repoPath } = body

  if (!repoPath?.trim()) {
    return NextResponse.json({ ok: false, error: 'A repository path is required.' }, { status: 400 })
  }

  const resolved = repoPath.trim()
  const ingest = ingestRepo(resolved)
  if (!ingest.ok) {
    return NextResponse.json({ ok: false, error: ingest.error }, { status: 422 })
  }

  const userPrompt = buildPmPrompt(ingest.files)

  const [stdout, contributors] = await Promise.all([
    runClaude(PM_SYSTEM_PROMPT, userPrompt),
    analyzeContributors(resolved),
  ])

  try {
    const briefing = parseClaudeJsonOutput<BriefingOutput>(stdout)
    const meta: BriefingMeta = {
      owner: contributors.owner,
      recentContributors: contributors.recentContributors,
      repoName: path.basename(resolved),
    }
    return NextResponse.json({ ok: true, briefing, meta })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not parse response.' }, { status: 502 })
  }
}

