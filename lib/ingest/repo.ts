import fs from 'fs'
import path from 'path'

const TOKENS_PER_CHAR = 0.25 // rough estimate: 4 chars ≈ 1 token
const MAX_FILE_TOKENS = 3_000
const MAX_TOTAL_TOKENS = 30_000
const MAX_FILE_CHARS = Math.floor(MAX_FILE_TOKENS / TOKENS_PER_CHAR)

// PM role only reads docs and lightweight config — skips all source code
const PM_INCLUDE_EXTENSIONS = new Set(['.md', '.mdx', '.txt', '.rst'])
const PM_INCLUDE_EXACT = new Set(['package.json', 'template-config.json', '.teller.json'])
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.cache'])

type FileEntry = { path: string; content: string; truncated: boolean }

export type IngestResult =
  | { ok: true; files: FileEntry[]; totalTokenEstimate: number }
  | { ok: false; error: string }

export function ingestRepo(repoPath: string): IngestResult {
  const resolved = path.resolve(repoPath)

  if (!fs.existsSync(resolved)) {
    return { ok: false, error: `Path does not exist: ${repoPath}` }
  }

  if (!fs.statSync(resolved).isDirectory()) {
    return { ok: false, error: `Path is not a directory: ${repoPath}` }
  }

  const readmePath = path.join(resolved, 'README.md')
  if (!fs.existsSync(readmePath)) {
    return {
      ok: false,
      error: 'No README.md found. Project Teller requires a README.md to generate a briefing. Add one and try again.',
    }
  }

  const files: FileEntry[] = []
  let totalChars = 0
  const totalCharLimit = Math.floor(MAX_TOTAL_TOKENS / TOKENS_PER_CHAR)

  // README always goes first
  const readmeContent = readFile(readmePath)
  files.push(readmeContent)
  totalChars += readmeContent.content.length

  collectFiles(resolved, resolved, files, { totalChars, totalCharLimit })

  const totalTokenEstimate = Math.floor(totalChars * TOKENS_PER_CHAR)
  return { ok: true, files, totalTokenEstimate }
}

function collectFiles(
  baseDir: string,
  dir: string,
  files: FileEntry[],
  state: { totalChars: number; totalCharLimit: number },
) {
  if (state.totalChars >= state.totalCharLimit) return

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  // Sort: .md files first, then others
  entries.sort((a, b) => {
    const aIsMd = a.name.endsWith('.md') ? 0 : 1
    const bIsMd = b.name.endsWith('.md') ? 0 : 1
    return aIsMd - bIsMd
  })

  for (const entry of entries) {
    if (state.totalChars >= state.totalCharLimit) break

    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      collectFiles(baseDir, fullPath, files, state)
      continue
    }

    if (!entry.isFile()) continue

    // Skip the README we already read
    if (relativePath === 'README.md') continue

    const ext = path.extname(entry.name).toLowerCase()
    const isIncluded = PM_INCLUDE_EXTENSIONS.has(ext) || PM_INCLUDE_EXACT.has(entry.name)
    if (!isIncluded) continue

    const result = readFile(fullPath)

    // For package.json — only keep name and description
    if (entry.name === 'package.json') {
      result.content = extractPackageMeta(result.content)
      result.truncated = false
    }

    files.push({ ...result, path: relativePath })
    state.totalChars += result.content.length
  }
}

function readFile(filePath: string): FileEntry {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (raw.length <= MAX_FILE_CHARS) {
      return { path: filePath, content: raw, truncated: false }
    }
    return {
      path: filePath,
      content: raw.slice(0, MAX_FILE_CHARS) + '\n\n[... truncated at 3,000 token limit ...]',
      truncated: true,
    }
  } catch {
    return { path: filePath, content: '[Could not read file]', truncated: false }
  }
}

function extractPackageMeta(raw: string): string {
  try {
    const pkg = JSON.parse(raw)
    const meta: Record<string, string> = {}
    if (pkg.name) meta.name = pkg.name
    if (pkg.description) meta.description = pkg.description
    if (pkg.version) meta.version = pkg.version
    return JSON.stringify(meta, null, 2)
  } catch {
    return raw.slice(0, 200)
  }
}
