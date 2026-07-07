import { NextRequest, NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude'
import { gatherEvidence } from '@/lib/evidence'
import { buildExpertisePrompt, EXPERTISE_SYSTEM_PROMPT } from '@/lib/prompts/expertise'
import { parseClaudeJsonOutput } from '@/lib/parseClaudeJson'
import { saveResult } from '@/lib/store'
import type { ExpertiseRequest, ExpertiseOutput } from '@/types'

export const maxDuration = 300

const encoder = new TextEncoder()

function sseStream(work: (send: (data: object) => void) => Promise<void>): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }
      try {
        await work(send)
      } catch (err) {
        send({ event: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      } finally {
        controller.close()
      }
    },
  })
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExpertiseRequest
  const question = body.question?.trim()

  if (!question) {
    return NextResponse.json({ ok: false, error: 'A question is required.' }, { status: 400 })
  }

  const stream = sseStream(async (send) => {
    send({ event: 'progress', message: 'Extracting keywords…' })
    const evidence = await gatherEvidence(question, (msg) => send({ event: 'progress', message: msg }))

    send({ event: 'progress', message: 'Analysing evidence with Claude…' })
    const stdout = await runClaude(EXPERTISE_SYSTEM_PROMPT, buildExpertisePrompt(question, evidence))

    const result = parseClaudeJsonOutput<ExpertiseOutput>(stdout)
    const id = await saveResult({ type: 'expertise', question, result, evidence })
    send({ event: 'result', id, result, evidence })
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
