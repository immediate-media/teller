import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { GitEvidenceItem, EvidenceBundle } from '@/types'

const execFileAsync = promisify(execFile)

const REPOS_ROOT = path.join(os.homedir(), 'Repos')
const EXCLUDED_REPO_NAMES = new Set(['project-teller'])
const GIT_TIMEOUT_MS = 8_000
const GLOBAL_DEADLINE_MS = 25_000
const MAX_KEYWORDS_FOR_GIT = 3
const MAX_COMMITS_PER_QUERY = 30
const MAX_AUTHORS_PER_REPO = 6
const REPO_CONCURRENCY = 6
const MAX_BUFFER = 5 * 1024 * 1024

type Mode = 'message' | 'content' | 'path'

type RawCommit = { hash: string; authorName: string; authorEmail: string; date: string; subject: string }

// Recent activity counts for much more than historical volume — someone who wrote a lot of
// code years ago and has since moved on is a worse "who to talk to" answer than someone with
// a handful of commits in the last few months, even though raw commit count says otherwise.
function recencyWeight(dateStr: string): number {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 90) return 1
  if (days <= 180) return 0.7
  if (days <= 365) return 0.4
  if (days <= 730) return 0.2
  return 0.05
}

function discoverRepos(): string[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(REPOS_ROOT, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter((e) => e.isDirectory() && !EXCLUDED_REPO_NAMES.has(e.name))
    .map((e) => path.join(REPOS_ROOT, e.name))
    .filter((repoPath) => fs.existsSync(path.join(repoPath, '.git')))
}

async function runGitLog(repoPath: string, args: string[]): Promise<RawCommit[]> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--all', '-i', ...args, '--pretty=format:%H|%an|%ae|%ad|%s', '--date=short', '-n', String(MAX_COMMITS_PER_QUERY)],
      { cwd: repoPath, timeout: GIT_TIMEOUT_MS, maxBuffer: MAX_BUFFER },
    )
    return stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|')
        if (parts.length < 5) return null
        const [hash, authorName, authorEmail, date, ...rest] = parts
        return { hash, authorName, authorEmail, date, subject: rest.join('|') }
      })
      .filter((c): c is RawCommit => c !== null)
  } catch {
    return []
  }
}

async function searchRepo(repoPath: string, keywords: string[]): Promise<GitEvidenceItem[]> {
  const matched = new Map<string, RawCommit & { modes: Set<Mode> }>()

  for (const kw of keywords.slice(0, MAX_KEYWORDS_FOR_GIT)) {
    const [messageHits, contentHits, pathHits] = await Promise.all([
      runGitLog(repoPath, [`--grep=${kw}`]),
      runGitLog(repoPath, [`-S${kw}`]),
      runGitLog(repoPath, ['--', `*${kw}*`]),
    ])

    for (const [hits, mode] of [[messageHits, 'message'], [contentHits, 'content'], [pathHits, 'path']] as [RawCommit[], Mode][]) {
      for (const commit of hits) {
        const existing = matched.get(commit.hash)
        if (existing) {
          existing.modes.add(mode)
        } else {
          matched.set(commit.hash, { ...commit, modes: new Set([mode]) })
        }
      }
    }
  }

  const byAuthor = new Map<string, { authorName: string; authorEmail: string; commits: (RawCommit & { modes: Set<Mode> })[] }>()
  for (const commit of matched.values()) {
    const key = commit.authorEmail || commit.authorName
    const bucket = byAuthor.get(key)
    if (bucket) {
      bucket.commits.push(commit)
    } else {
      byAuthor.set(key, { authorName: commit.authorName, authorEmail: commit.authorEmail, commits: [commit] })
    }
  }

  const repoName = path.basename(repoPath)
  const stats = Array.from(byAuthor.values()).map(({ authorName, authorEmail, commits }) => {
    const sorted = [...commits].sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first
    const matchedOn = new Set<Mode>()
    for (const c of commits) for (const m of c.modes) matchedOn.add(m)
    const item: GitEvidenceItem = {
      repo: repoName,
      authorName,
      authorEmail,
      commitCount: commits.length,
      firstCommitDate: sorted[sorted.length - 1].date,
      lastCommitDate: sorted[0].date,
      sampleSubjects: sorted.slice(0, 3).map((c) => c.subject),
      matchedOn: Array.from(matchedOn),
    }
    const recencyScore = commits.reduce((sum, c) => sum + recencyWeight(c.date), 0)
    return { item, recencyScore, commitCount: commits.length }
  })

  // Keep both signals distinct: someone with high historical volume but zero recent
  // activity is a "maker" candidate that a pure-recency ranking would otherwise drop
  // entirely before it ever reaches the model.
  const byVolume = [...stats].sort((a, b) => b.commitCount - a.commitCount).slice(0, MAX_AUTHORS_PER_REPO)
  const byRecency = [...stats].sort((a, b) => b.recencyScore - a.recencyScore).slice(0, MAX_AUTHORS_PER_REPO)

  const selected = new Map<string, GitEvidenceItem>()
  for (const s of [...byVolume, ...byRecency]) {
    selected.set(s.item.authorEmail || s.item.authorName, s.item)
  }

  return Array.from(selected.values())
}

export async function gatherGitEvidence(keywords: string[]): Promise<EvidenceBundle['git']> {
  const repos = discoverRepos()
  if (repos.length === 0) {
    return { status: 'error', items: [], error: `No git repos found under ${REPOS_ROOT}`, reposScanned: 0, reposSkipped: 0 }
  }

  const startedAt = Date.now()
  const allItems: GitEvidenceItem[] = []
  let reposScanned = 0
  let reposSkipped = 0

  const remaining = [...repos]
  while (remaining.length > 0) {
    if (Date.now() - startedAt > GLOBAL_DEADLINE_MS) {
      reposSkipped += remaining.length
      break
    }
    const batch = remaining.splice(0, REPO_CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(async (repoPath) => {
        try {
          const items = await searchRepo(repoPath, keywords)
          return { ok: true as const, items }
        } catch {
          return { ok: false as const, items: [] as GitEvidenceItem[] }
        }
      }),
    )
    for (const result of batchResults) {
      if (result.ok) {
        reposScanned++
        allItems.push(...result.items)
      } else {
        reposSkipped++
      }
    }
  }

  return { status: 'ok', items: allItems, reposScanned, reposSkipped }
}
