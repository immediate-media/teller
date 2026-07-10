import Anthropic from '@anthropic-ai/sdk'
import { MOCK_BRIEFING, MOCK_EXPERTISE, mockDelay } from '@/lib/mock/fixtures'

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-haiku-4-5'
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
  if (process.env.TELLER_MOCK === 'true') {
    await mockDelay(2000)
    // Return briefing fixture when the system prompt mentions PM briefing, expertise otherwise
    const fixture = systemPrompt.includes('PM briefing') ? MOCK_BRIEFING : MOCK_EXPERTISE
    return JSON.stringify(fixture)
  }

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
