import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude'
import { ingestRepo } from '@/lib/ingest'
import { analyzeContributors } from '@/lib/ingest/contributors'
import { buildPmPrompt, PM_SYSTEM_PROMPT } from '@/lib/prompts/pm'
import { parseClaudeJsonOutput } from '@/lib/parseClaudeJson'
import { saveResult } from '@/lib/store'
import type { AnalyzeRequest, BriefingMeta, BriefingOutput } from '@/types'

export const maxDuration = 120

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
  const body = (await req.json()) as AnalyzeRequest
  const { repoPath } = body

  if (!repoPath?.trim()) {
    return NextResponse.json({ ok: false, error: 'A repository path is required.' }, { status: 400 })
  }

  const resolved = repoPath.trim()

  const stream = sseStream(async (send) => {
    send({ event: 'progress', message: 'Reading repository files…' })
    const ingest = ingestRepo(resolved)
    if (!ingest.ok) {
      send({ event: 'error', message: ingest.error })
      return
    }

    send({ event: 'progress', message: 'Scanning git history…' })
    const contributors = await analyzeContributors(resolved)

    send({ event: 'progress', message: 'Generating briefing with Claude…' })
    const stdout = await runClaude(PM_SYSTEM_PROMPT, buildPmPrompt(ingest.files))

    const briefing = parseClaudeJsonOutput<BriefingOutput>(stdout)
    const meta: BriefingMeta = {
      owner: contributors.owner,
      recentContributors: contributors.recentContributors,
      repoName: path.basename(resolved),
    }
    const id = await saveResult({ type: 'briefing', repoPath: resolved, briefing, meta })
    send({ event: 'result', id, briefing, meta })
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}

