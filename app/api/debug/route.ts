import { execFile } from 'child_process'
import { promisify } from 'util'
import { NextResponse } from 'next/server'
import { CLAUDE_BIN } from '@/lib/cli'

const execFileAsync = promisify(execFile)

const ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'CLAUDE_MODEL',
  'CLAUDE_BIN',
  'ATLASSIAN_URL',
  'ATLASSIAN_EMAIL',
  'ATLASSIAN_API_TOKEN',
]

async function checkBin(bin: string, args: string[]): Promise<{ available: boolean; output?: string; error?: string }> {
  try {
    const { stdout } = await execFileAsync(bin, args, { timeout: 3_000 })
    return { available: true, output: stdout.trim() }
  } catch (err) {
    return { available: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function GET() {
  const [git, claudeCli] = await Promise.all([
    checkBin('git', ['--version']),
    checkBin(CLAUDE_BIN, ['--version']),
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    node: process.version,
    env: Object.fromEntries(ENV_VARS.map((k) => [k, process.env[k] ? 'set' : 'missing'])),
    git,
    claudeCli: { ...claudeCli, bin: CLAUDE_BIN },
  })
}
