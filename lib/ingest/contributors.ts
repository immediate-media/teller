import { execFile } from 'child_process'
import { promisify } from 'util'
import type { BriefingContributor } from '@/types'

const execFileAsync = promisify(execFile)

const MAX_COMMITS = 1000
const MAX_RECENT_CONTRIBUTORS = 3
const MAX_BUFFER = 2 * 1024 * 1024

function recencyWeight(dateStr: string): number {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 90) return 1
  if (days <= 180) return 0.7
  if (days <= 365) return 0.4
  if (days <= 730) return 0.2
  return 0.05
}

export type ContributorsResult = {
  owner: BriefingContributor | null
  recentContributors: BriefingContributor[]
}

export async function analyzeContributors(repoPath: string): Promise<ContributorsResult> {
  const empty: ContributorsResult = { owner: null, recentContributors: [] }

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--all', '--pretty=format:%an|%ae|%ad', '--date=short', '-n', String(MAX_COMMITS)],
      { cwd: repoPath, timeout: 10_000, maxBuffer: MAX_BUFFER },
    )

    if (!stdout.trim()) return empty

    type AuthorData = {
      name: string
      email: string | undefined
      commitCount: number
      firstCommitDate: string
      lastCommitDate: string
      recencyScore: number
    }

    const byAuthor = new Map<string, AuthorData>()

    for (const line of stdout.split('\n').filter(Boolean)) {
      const parts = line.split('|')
      if (parts.length < 3) continue
      const [rawName, rawEmail, date] = parts
      const name = rawName.trim()
      const email = rawEmail.trim() || undefined
      if (!name || !date) continue

      const key = email ?? name
      const existing = byAuthor.get(key)
      if (existing) {
        existing.commitCount++
        if (date < existing.firstCommitDate) existing.firstCommitDate = date
        if (date > existing.lastCommitDate) existing.lastCommitDate = date
        existing.recencyScore += recencyWeight(date)
      } else {
        byAuthor.set(key, {
          name,
          email,
          commitCount: 1,
          firstCommitDate: date,
          lastCommitDate: date,
          recencyScore: recencyWeight(date),
        })
      }
    }

    if (byAuthor.size === 0) return empty

    const authors = Array.from(byAuthor.values())

    const ownerData = [...authors].sort((a, b) => b.commitCount - a.commitCount)[0]
    const owner: BriefingContributor = {
      name: ownerData.name,
      email: ownerData.email,
      commitCount: ownerData.commitCount,
      firstCommitDate: ownerData.firstCommitDate,
      lastCommitDate: ownerData.lastCommitDate,
    }

    const ownerKey = ownerData.email ?? ownerData.name
    const recentContributors: BriefingContributor[] = [...authors]
      .filter((a) => (a.email ?? a.name) !== ownerKey)
      .sort((a, b) => b.recencyScore - a.recencyScore)
      .slice(0, MAX_RECENT_CONTRIBUTORS)
      .map(({ name, email, commitCount, firstCommitDate, lastCommitDate }) => ({
        name,
        email,
        commitCount,
        firstCommitDate,
        lastCommitDate,
      }))

    return { owner, recentContributors }
  } catch {
    return empty
  }
}
