# Project Teller

Teller answers your questions by searching Git history, Jira, and Confluence for the people with the most relevant context.

Built for Immediate Media. Runs locally.

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/immediate-media/teller.git
cd teller
```

### 2. Run the setup script

```bash
npm run setup
```

The script will guide you through everything: checking prerequisites, collecting credentials, validating them, and starting the dev server. You'll need:

- **Anthropic API key** — ask your lead or a senior engineer
- **Atlassian credentials** — your standard IM Atlassian account email + an API token ([create one here](https://id.atlassian.com/manage-profile/security/api-tokens))

Once running, open [http://localhost:3000](http://localhost:3000).

---

## Manual setup (if you prefer)

```bash
cp .env.local.example .env.local
# fill in .env.local, then:
yarn install
yarn dev
```

---

## Features

- **Who to ask** — ask a question, get back the people most likely to have the answer, backed by evidence from git commits, Jira issues, and Confluence pages.
- **Project briefing** — point it at a local repo path, get a structured PM briefing covering summary, current state, how it works, risks, dependencies, and more.
- **History** — every result is saved locally to `~/.teller/results/`. Re-view any past result without regenerating it.
- **Rating** — mark results 👍 or 👎 to track response quality over time.
- **Export** — download a structured JSON export of any thumbs-up result.
