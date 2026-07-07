import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import type { ResultRating, ResultSummary, StoredBriefing, StoredExpertise, StoredResult } from '@/types'

const STORE_DIR = path.join(os.homedir(), '.teller', 'results')

async function ensureDir() {
  await fs.mkdir(STORE_DIR, { recursive: true })
}

function resultPath(id: string) {
  return path.join(STORE_DIR, `${id}.json`)
}

type NewStoredResult =
  | Omit<StoredBriefing, 'id' | 'rating' | 'createdAt'>
  | Omit<StoredExpertise, 'id' | 'rating' | 'createdAt'>

export async function saveResult(data: NewStoredResult): Promise<string> {
  await ensureDir()
  const id = randomUUID()
  const stored: StoredResult = { ...data, id, rating: null, createdAt: new Date().toISOString() } as StoredResult
  await fs.writeFile(resultPath(id), JSON.stringify(stored, null, 2))
  return id
}

export async function getResult(id: string): Promise<StoredResult | null> {
  try {
    return JSON.parse(await fs.readFile(resultPath(id), 'utf-8')) as StoredResult
  } catch {
    return null
  }
}

export async function rateResult(id: string, rating: ResultRating): Promise<boolean> {
  const result = await getResult(id)
  if (!result) return false
  result.rating = rating
  await fs.writeFile(resultPath(id), JSON.stringify(result, null, 2))
  return true
}

export async function listResults(): Promise<ResultSummary[]> {
  await ensureDir()
  let files: string[]
  try {
    files = (await fs.readdir(STORE_DIR)).filter((f) => f.endsWith('.json'))
  } catch {
    return []
  }

  const summaries: ResultSummary[] = []
  for (const file of files) {
    try {
      const data = JSON.parse(await fs.readFile(path.join(STORE_DIR, file), 'utf-8')) as StoredResult
      summaries.push({
        id: data.id,
        type: data.type,
        title: data.type === 'briefing' ? data.meta.repoName : data.question,
        rating: data.rating,
        createdAt: data.createdAt,
      })
    } catch {
      // skip corrupt files
    }
  }

  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
