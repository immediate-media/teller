import type { ChildProcess } from 'child_process'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { spawnClaude } from '@/lib/cli'
import { ingestRepo } from '@/lib/ingest'
import { analyzeContributors } from '@/lib/ingest/contributors'
import { buildPmPrompt, PM_SYSTEM_PROMPT } from '@/lib/prompts/pm'
import { parseClaudeJsonOutput } from '@/lib/parseClaudeJson'
import type { AnalyzeRequest, BriefingMeta, BriefingOutput } from '@/types'

export const maxDuration = 120

function collectOutput(child: ChildProcess): Promise<{ stdout: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    let stdout = ''
    child.stdout!.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf-8') })
    child.on('error', reject)
    child.on('close', (code) => resolve({ stdout, exitCode: code }))
  })
}

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
  const child = spawnClaude(PM_SYSTEM_PROMPT, userPrompt)

  const [{ stdout, exitCode }, contributors] = await Promise.all([
    collectOutput(child),
    analyzeContributors(resolved),
  ])

  if (exitCode !== 0) {
    return NextResponse.json({ ok: false, error: `Claude CLI exited with code ${exitCode}` }, { status: 502 })
  }

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

