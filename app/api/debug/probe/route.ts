import { NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude'

export const maxDuration = 30

export async function GET() {
  const start = Date.now()
  try {
    const response = await runClaude('You are a test assistant.', 'Reply with just the word "ok". Nothing else.')
    return NextResponse.json({
      ok: true,
      response: response.trim(),
      durationMs: Date.now() - start,
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    }, { status: 502 })
  }
}
