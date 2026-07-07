# Project Teller

Teller answers your questions by searching Git history, Jira, and Confluence for the people with the most relevant context.

Built for Immediate Media. Runs locally on our infrastructure, using Anthropic API & Databricks

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/immediate-media/teller.git
cd teller
yarn install
```

### 2. Set up your environment

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and fill in the values below.

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | API tokens are provided by your lead or a senior — ask them if you don't have them|
| `JIRA_URL` | Your Jira instance URL, e.g. https://immediateco.atlassian.net/ |
| `JIRA_USERNAME` | For "Who to talk to" | Your Atlassian account email |
| `JIRA_API_TOKEN` | For "Who to talk to" | Jira API token |
| `CONFLUENCE_URL` | For "Who to talk to" | Your Confluence instance URL |
| `CONFLUENCE_USERNAME` | For "Who to talk to" | Your Atlassian account email |
| `CONFLUENCE_API_TOKEN` | For "Who to talk to" | Confluence API token |

### 3. Run the dev server

```bash
yarn run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

- **Brief me on a project** — point it at a local repo path, get a structured PM briefing covering summary, current state, how it works, risks, dependencies, and more. Also surfaces the project owner and recent contributors from git history.
- **Who to talk to** — ask a question, get back the people most likely to have the answer, backed by evidence from git commits, Jira issues, and Confluence pages.
- **History** — every result is saved locally to `~/.teller/results/`. Re-view any past result without regenerating it.
- **Rating** — mark results 👍 or 👎 to track response quality over time.
