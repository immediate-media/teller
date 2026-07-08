'use client'

import { useEffect, useState } from 'react'

const REAL_STEPS = [
  'Extracting keywords from your question…',
  'Scanning git history across repos…',
  'Identifying contributors to relevant files and paths…',
  'Searching Jira for related tickets and assignees…',
  'Searching Confluence for relevant pages and authors…',
  'Cross-referencing commit authors with Jira assignees…',
  'Weighing evidence across sources…',
  'Ranking candidates by confidence…',
  'Building your response…',
]

const HUMOROUS_LINES = [
  "Checking who's actually online vs. just green-dot lying…",
  'Reading a doc titled "FINAL_v2_reallyfinal(1).docx"…',
  'Refining search radius (excluding Jack)…',
  'Analysing anyone who\'s typed "quick q" unironically in recent tickets…',
  'Searching for a Solutions Architect… found none',
  'Cross-referencing "people who said they\'d document this" vs. "people who did"…',
  'Simulating what Luke would say…',
  'Checking staff directory for anyone still listed who left 8 months ago…',
  "Weighing whether to interrupt someone's focus block that's been set since March…",
  'Opening Jira ticket… closing as "won\'t fix" in a comment…',
  'Searching Confluence… found 3 pages, all last edited in 2022…',
  'Searching for the one person who actually knows how the deploy script works…',
]

function buildStepSequence(): string[] {
  const humourCount = 2 + Math.floor(Math.random() * 2) // 2 or 3
  const shuffled = [...HUMOROUS_LINES].sort(() => Math.random() - 0.5).slice(0, humourCount)

  // Insert humorous lines at random positions, avoiding first and last real step
  const steps = [...REAL_STEPS]
  const usedPositions = new Set<number>()
  for (const line of shuffled) {
    let pos: number
    do {
      pos = 1 + Math.floor(Math.random() * (steps.length - 2))
    } while (usedPositions.has(pos))
    usedPositions.add(pos)
    steps.splice(pos, 0, line)
  }
  return steps
}

export function ThinkingBubbles() {
  const [steps] = useState(() => buildStepSequence())
  const [visible, setVisible] = useState<{ id: number; idx: number }[]>([{ id: 0, idx: 0 }])

  useEffect(() => {
    let counter = 1
    const t = setInterval(() => {
      setVisible((v) => {
        const lastIdx = v[v.length - 1].idx
        if (lastIdx >= steps.length - 1) return v // stop at end
        const nextIdx = lastIdx + 1
        const appended = [...v, { id: counter++, idx: nextIdx }]
        return appended.slice(-4)
      })
    }, 2800)
    return () => clearInterval(t)
  }, [steps.length])

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Thinking out loud
      </div>
      <ul className="space-y-2">
        {visible.map((item, i) => {
          const isLatest = i === visible.length - 1
          return (
            <li
              key={item.id}
              className="flex items-start gap-2.5"
            >
              <span className="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-primary/70" />
              <span
                className={
                  'text-sm leading-relaxed ' +
                  (isLatest
                    ? 'text-foreground'
                    : 'text-muted-foreground line-through decoration-muted-foreground/30')
                }
              >
                {steps[item.idx]}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
