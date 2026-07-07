const STOPWORDS = new Set([
  'who', 'what', 'when', 'where', 'why', 'how', 'does', 'do', 'is', 'are', 'was',
  'were', 'the', 'a', 'an', 'for', 'on', 'in', 'to', 'of', 'and', 'or', 'about',
  'knows', 'know', 'knowledge', 'best', 'answer', 'talk', 'ask', 'can', 'should',
  'i', 'we', 'our', 'my', 'this', 'that', 'with', 'has', 'have', 'had', 'it',
])

const MAX_KEYWORDS = 5

export function extractKeywords(question: string): string[] {
  const rawTokens = question.match(/[A-Za-z0-9][A-Za-z0-9-]*/g) ?? []

  const keywords: string[] = []
  for (const raw of rawTokens) {
    const lower = raw.toLowerCase()
    const isAcronym = raw.length >= 2 && raw === raw.toUpperCase() && /[A-Z]/.test(raw)
    if (STOPWORDS.has(lower)) continue
    if (lower.length < 3 && !isAcronym) continue
    if (!keywords.includes(lower)) keywords.push(lower)
  }

  return keywords.slice(0, MAX_KEYWORDS)
}
