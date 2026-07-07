# Project Teller

Project Teller is an internal tool that generates structured PM briefings from a local repository, and answers "who do I talk to about X?" by searching git history, Jira, and Confluence for the people with the most relevant context.

Built for Immediate Media. Runs locally — no data leaves your machine except the prompts sent to the Anthropic API.

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/immediate-media/teller.git
cd teller
npm install
```

### 2. Set up your environment

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and fill in the values below. **API tokens are provided by your lead or a senior — ask them if you don't have them.**

| Variable | Required | What it is |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Anthropic API key — powers the briefing and expertise analysis |
| `JIRA_URL` | For "Who to talk to" | Your Jira instance URL, e.g. `https://yourorg.atlassian.net` |
| `JIRA_USERNAME` | For "Who to talk to" | Your Atlassian account email |
| `JIRA_API_TOKEN` | For "Who to talk to" | Jira API token |
| `CONFLUENCE_URL` | For "Who to talk to" | Your Confluence instance URL |
| `CONFLUENCE_USERNAME` | For "Who to talk to" | Your Atlassian account email |
| `CONFLUENCE_API_TOKEN` | For "Who to talk to" | Confluence API token |
| `CLAUDE_MODEL` | No | Override the AI model (default: `claude-opus-4-5`) |
| `CLAUDE_BIN` | No | Path to Claude CLI binary — only needed for the follow-up thread feature |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- **Brief me on a project** — point it at a local repo path, get a structured PM briefing covering summary, current state, how it works, risks, dependencies, and more. Also surfaces the project owner and recent contributors from git history.
- **Who to talk to** — ask a question, get back the people most likely to have the answer, backed by evidence from git commits, Jira issues, and Confluence pages.
- **History** — every result is saved locally to `~/.teller/results/`. Re-view any past result without regenerating it.
- **Rating** — mark results 👍 or 👎 to track response quality over time.
