import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const THOUGHTS = [
  "Finding someone other than Jack who can answer this…",
  "Asking around — quietly, so the solutions architects don't hear…",
  "Checking who's actually in the office this week…",
  "Grepping Confluence like it's 1999…",
  "Rummaging through Slack DMs (with consent)…",
  "Consulting the one person who read the RFC…",
  "Reticulating splines…",
  "Warming up the LLM — it just woke up…",
  "Cross-referencing tribal knowledge with actual docs…",
  "Trying not to just tag @channel…",
  "Politely nudging the on-call engineer…",
  "Convincing the vector DB it does, in fact, remember…",
  "Filtering out answers that start with 'it depends'…",
  "Asking a Principal Engineer to translate from architect…",
  "Reading between the lines of a 3-year-old Jira ticket…",
  "Compiling opinions. Please hold…",
  "Double-checking this isn't documented in someone's Notion…",
  "Locating the source of truth (there are four)…",
  "Ignoring the Figma file that says 'FINAL_final_v3'…",
  "Making sure the answer isn't just 'restart it'…",
];

export function ThinkingBubbles() {
  const [order] = useState(() => {
    const arr = [...THOUGHTS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [visible, setVisible] = useState<{ id: number; idx: number }[]>([
    { id: 0, idx: 0 },
  ]);

  useEffect(() => {
    let counter = 1;
    const t = setInterval(() => {
      setVisible((v) => {
        const lastIdx = v[v.length - 1].idx;
        const nextIdx = (lastIdx + 1) % order.length;
        const appended = [...v, { id: counter++, idx: nextIdx }];
        return appended.slice(-4);
      });
    }, 1600);
    return () => clearInterval(t);
  }, [order.length]);

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
            const isLatest = i === visible.length - 1;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{
                  opacity: isLatest ? 1 : 0.45,
                  y: 0,
                  scale: 1,
                }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex items-start gap-2.5"
              >
                <span className="mt-1.5 inline-flex size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span
                  className={
                    "text-sm leading-relaxed " +
                    (isLatest ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/30")
                  }
                >
                  {order[item.idx]}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
