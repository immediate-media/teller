import { execFile } from 'child_process'
import { CLAUDE_BIN } from '@/lib/cli'
import { MOCK_JIRA_ITEMS, MOCK_CONFLUENCE_ITEMS, mockDelay } from '@/lib/mock/fixtures'

const MAX_BUFFER = 5 * 1024 * 1024
const MODEL = 'claude-sonnet-4-6'

// Always closes stdin immediately — without this the CLI waits for input that will
// never arrive and eventually gets killed by the timeout instead of failing fast.
export function runClaudeTool(args: string[], timeoutMs: number): Promise<string> {
  if (process.env.TELLER_MOCK === 'true') {
    return mockDelay(1500).then(() =>
      JSON.stringify({
        is_error: false,
        result: `\`\`\`json\n${JSON.stringify({ jira: MOCK_JIRA_ITEMS, confluence: MOCK_CONFLUENCE_ITEMS })}\n\`\`\``,
      }),
    )
  }

  return new Promise((resolve, reject) => {
    const child = execFile(CLAUDE_BIN, ['--model', MODEL, ...args], { timeout: timeoutMs, maxBuffer: MAX_BUFFER }, (err, stdout, stderr) => {
      if (err) {
        if (err.killed || err.signal) {
          reject(new Error(`timed out after ${timeoutMs}ms (signal: ${err.signal})`))
          return
        }
        reject(new Error(stderr.trim() || err.message))
        return
      }
      resolve(stdout)
    })
    child.stdin?.end()
  })
}
