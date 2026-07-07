import { NextRequest, NextResponse } from 'next/server'
import type { ChildProcess } from 'child_process'
import { spawnClaude } from '@/lib/cli'
import { gatherEvidence } from '@/lib/evidence'
import { buildExpertisePrompt, EXPERTISE_SYSTEM_PROMPT } from '@/lib/prompts/expertise'
import { parseClaudeJsonOutput } from '@/lib/parseClaudeJson'
import type { ExpertiseRequest, ExpertiseOutput } from '@/types'

export const maxDuration = 300

function collectOutput(child: ChildProcess): Promise<{ stdout: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    let stdout = ''
    child.stdout!.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8')
    })
    child.on('error', reject)
    child.on('close', (code) => resolve({ stdout, exitCode: code }))
  })
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExpertiseRequest
  const question = body.question?.trim()

  if (!question) {
    return NextResponse.json({ ok: false, error: 'A question is required.' }, { status: 400 })
  }

  const evidence = await gatherEvidence(question)
  const userPrompt = buildExpertisePrompt(question, evidence)
  const child = spawnClaude(EXPERTISE_SYSTEM_PROMPT, userPrompt)

  const { stdout, exitCode } = await collectOutput(child)
  if (exitCode !== 0) {
    return NextResponse.json({ ok: false, error: `Claude CLI exited with code ${exitCode}` }, { status: 502 })
  }

  try {
    const result = parseClaudeJsonOutput<ExpertiseOutput>(stdout)
    return NextResponse.json({ ok: true, result, evidence })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not parse response.' }, { status: 502 })
  }
}
