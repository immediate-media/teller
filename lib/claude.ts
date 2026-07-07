import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-4-5'
const MAX_TOKENS = 8192

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local.')
    }
    _client = new Anthropic()
  }
  return _client
}

export async function runClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })
  const block = message.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new Error('No text content in Claude response.')
  }
  return block.text
}
