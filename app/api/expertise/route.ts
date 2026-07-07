import { NextRequest, NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude'
import { gatherEvidence } from '@/lib/evidence'
import { buildExpertisePrompt, EXPERTISE_SYSTEM_PROMPT } from '@/lib/prompts/expertise'
import { parseClaudeJsonOutput } from '@/lib/parseClaudeJson'
import type { ExpertiseRequest, ExpertiseOutput } from '@/types'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExpertiseRequest
  const question = body.question?.trim()

  if (!question) {
    return NextResponse.json({ ok: false, error: 'A question is required.' }, { status: 400 })
  }

  const evidence = await gatherEvidence(question)
  const userPrompt = buildExpertisePrompt(question, evidence)
  const stdout = await runClaude(EXPERTISE_SYSTEM_PROMPT, userPrompt)

  try {
    const result = parseClaudeJsonOutput<ExpertiseOutput>(stdout)
    return NextResponse.json({ ok: true, result, evidence })
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not parse response.' }, { status: 502 })
  }
}
