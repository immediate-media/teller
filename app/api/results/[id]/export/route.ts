import { NextRequest, NextResponse } from 'next/server'
import { getResult } from '@/lib/store'
import type { BriefingContributor, ExpertiseCandidate, StoredBriefing, StoredExpertise } from '@/types'

function helperFromContributor(c: BriefingContributor, topicsOwned: string[], createdAt: string) {
  return {
    helper: c.email ?? c.name,
    helper_name: c.name,
    team: null,
    skills: null,
    topics_owned: topicsOwned,
    willingness_status: null,
    availability_status: null,
    helper_type: 'person',
    updated_at: createdAt,
  }
}

function helperFromCandidate(c: ExpertiseCandidate, topicsOwned: string[], createdAt: string) {
  return {
    helper: c.email ?? c.name,
    helper_name: c.name,
    team: null,
    skills: null,
    topics_owned: topicsOwned,
    willingness_status: null,
    availability_status: null,
    helper_type: 'person',
    updated_at: createdAt,
  }
}

function mapBriefing(stored: StoredBriefing) {
  const contributors = [stored.meta.owner, ...stored.meta.recentContributors].filter(
    (c): c is BriefingContributor => c !== null,
  )
  return {
    helper_profiles: contributors.map((c) =>
      helperFromContributor(c, [stored.meta.repoName], stored.createdAt),
    ),
  }
}

function mapExpertise(stored: StoredExpertise) {
  const topCandidate = stored.result.makers[0] ?? stored.result.maintainers[0] ?? null

  const ask_person_request = {
    asker: null,
    question_text: stored.question,
    assigned_helper: topCandidate?.name ?? null,
    request_status: 'resolved',
    mcp_answer_text: stored.result.summary,
    retrieved_context_json: null,
    human_answer_text: null,
    is_solved: true,
    answer_types: 'auto',
    created_at: stored.createdAt,
    updated_at: stored.createdAt,
  }

  // Deduplicate candidates that appear in both makers and maintainers
  const seen = new Set<string>()
  const helper_profiles = [...stored.result.makers, ...stored.result.maintainers]
    .filter((c) => {
      const key = c.email ?? c.name
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((c) => helperFromCandidate(c, [stored.question], stored.createdAt))

  return { ask_person_request, helper_profiles }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const result = await getResult(id)

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payload = result.type === 'briefing' ? mapBriefing(result) : mapExpertise(result)
  const filename = `teller-export-${result.type}-${id.slice(0, 8)}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
