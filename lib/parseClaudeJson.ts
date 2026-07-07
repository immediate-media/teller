export function parseClaudeJsonOutput<T>(raw: string): T {
  const jsonStart = raw.indexOf('{')
  const jsonEnd = raw.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON found in Claude output.')
  }
  return JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as T
}
