export function buildAtlassianMcpConfig(): object | null {
  const { ATLASSIAN_URL, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN } = process.env

  if (!ATLASSIAN_URL || !ATLASSIAN_EMAIL || !ATLASSIAN_API_TOKEN) {
    return null
  }

  const baseUrl = ATLASSIAN_URL.replace(/\/$/, '')

  return {
    mcpServers: {
      'mcp-atlassian': {
        command: 'uvx',
        args: ['mcp-atlassian'],
        env: {
          JIRA_URL: baseUrl,
          JIRA_USERNAME: ATLASSIAN_EMAIL,
          JIRA_API_TOKEN: ATLASSIAN_API_TOKEN,
          CONFLUENCE_URL: baseUrl,
          CONFLUENCE_USERNAME: ATLASSIAN_EMAIL,
          CONFLUENCE_API_TOKEN: ATLASSIAN_API_TOKEN,
        },
      },
    },
  }
}
