export function buildAtlassianMcpConfig(): object | null {
  const { JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN, CONFLUENCE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN } = process.env

  if (!JIRA_URL || !JIRA_USERNAME || !JIRA_API_TOKEN || !CONFLUENCE_URL || !CONFLUENCE_USERNAME || !CONFLUENCE_API_TOKEN) {
    return null
  }

  return {
    mcpServers: {
      'mcp-atlassian': {
        command: 'uvx',
        args: ['mcp-atlassian'],
        env: { JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN, CONFLUENCE_URL, CONFLUENCE_USERNAME, CONFLUENCE_API_TOKEN },
      },
    },
  }
}
