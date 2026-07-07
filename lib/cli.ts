// CLAUDE_BIN is used by runClaudeTool for MCP-based flows (Atlassian evidence, follow-up).
// The main analysis routes use the Anthropic SDK directly via lib/claude.ts.
export const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude'
