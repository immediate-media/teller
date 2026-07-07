'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const THOUGHTS = [
  "Checking who's actually online vs. just green-dot lying…",
  "Searching Confluence Memory… (finding 3 pages, all last edited in 2022)",
  'Reading a doc titled "FINAL_v2_reallyfinal(1).docx"…',
  'Refining Search Radius (excluding Jack)…',
  'Evaluating next steps…',
  'Analysing recent Slack messages for anyone who\'s typed "quick q" unironically…',
  'Analysing Tribal Knowledge Patterns…',
  'Searching for a Solutions Architect… found none',
  'Cross referencing "people who said they\'d document this" vs. "people who did"…',
  'Evaluating next steps…',
  'Simulating what Luke would say…',
  'Checking staff directory for anyone still listed who left 8 months ago…',
  "Weighing whether to interrupt someone's \"focus time\" block that's been permanently set since March…",
  'Reading Jira ticket, discovering it was closed as "won\'t fix" as a comment…',
  'Evaluating next steps…',
  'Analysing whether this is a "just Google it" situation…',
  'Searching for the one person who actually knows how the deploy script works…',
  'Suggesting answer…',
]

export function ThinkingBubbles() {
  const [order] = useState(() => {
    const arr = [...THOUGHTS]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })
  const [visible, setVisible] = useState<{ id: number; idx: number }[]>([{ id: 0, idx: 0 }])

  useEffect(() => {
    let counter = 1
    const t = setInterval(() => {
      setVisible((v) => {
        const lastIdx = v[v.length - 1].idx
        const nextIdx = (lastIdx + 1) % order.length
        const appended = [...v, { id: counter++, idx: nextIdx }]
        return appended.slice(-4)
      })
    }, 1800)
    return () => clearInterval(t)
  }, [order.length])

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Thinking out loud
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((item, i) => {
            const isLatest = i === visible.length - 1
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: isLatest ? 1 : 0.4, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
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
                  {order[item.idx]}
                </span>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}
