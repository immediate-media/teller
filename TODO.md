# Project Teller — Todo

## What's built (v1)

- Next.js 16 app, PM-role briefing with 9 structured sections
- File ingestion: README gate (hard reject if missing), PM filter (docs only, skips source code), 3k token cap per file, 30k total cap
- Claude CLI integration via `child_process` — no API key needed, uses authenticated local session
- Honest loading state with timing message
- "New briefing" reset flow

---

## Known tech debt

- `lib/claude.ts` and `@anthropic-ai/sdk` are installed but unused — left over from before switching to the CLI. Can be removed.
- Streaming is wired at the transport layer (ReadableStream) but the CLI buffers its full response, so there's no actual incremental progress. Real streaming requires either the Anthropic API (API key) or `node-pty` to give the CLI a fake TTY.

---

## Phase 2 backlog

| Priority | Item | Notes |
|----------|------|-------|
| High | Real streaming | Needs API key (Anthropic SDK) or `node-pty`. Transport plumbing is mostly there. |
| High | Confluence URL input | `confluenceUrls` already in `AnalyzeRequest` type and `buildPmPrompt` signature — just needs UI field and fetching logic wired up. |
| Medium | Other roles — Dev, QA | Dev role needs source code included in ingest (currently PM filter skips all source). Needs role selector on intake form. |
| Medium | `.teller.json` config | Optional file repos can add to pre-declare team, Jira key, Confluence URLs, status. Reduces inference, saves tokens. |
| Low | GitHub URL ingestion | Currently local paths only. Would need cloning or GitHub API access. |
| Low | Interactive assumption-checking | Post-briefing flow: Claude asks "Is X still accurate?" to validate its output. |
| Low | CLI mode | `teller <path>` terminal command — was phase 2 from the start. |
