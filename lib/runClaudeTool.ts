import { execFile } from 'child_process'
import { CLAUDE_BIN } from '@/lib/cli'

const MAX_BUFFER = 5 * 1024 * 1024

// Always closes stdin immediately — without this the CLI waits for input that will
// never arrive and eventually gets killed by the timeout instead of failing fast.
export function runClaudeTool(args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(CLAUDE_BIN, args, { timeout: timeoutMs, maxBuffer: MAX_BUFFER }, (err, stdout, stderr) => {
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
