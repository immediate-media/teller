import { spawn, type ChildProcess } from 'child_process'

export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude'

export function spawnClaude(systemPrompt: string, userPrompt: string): ChildProcess {
  const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`
  const child = spawn(CLAUDE_BIN, ['-p'], { env: process.env })
  child.stdin.write(combined)
  child.stdin.end()
  return child
}
