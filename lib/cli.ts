import { spawn } from 'child_process'

const CLAUDE_BIN = '/Users/sam.pepper/.local/bin/claude'

export function runClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  // Combine prompts — CLI has no separate system field
  const combined = `${systemPrompt}\n\n---\n\n${userPrompt}`

  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, ['-p'], {
      env: process.env,
    })

    child.stdin.write(combined)
    child.stdin.end()

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    child.on('error', (err) => {
      reject(new Error(`Failed to start Claude CLI: ${err.message}`))
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr.trim()}`))
      } else {
        resolve(stdout.trim())
      }
    })
  })
}
