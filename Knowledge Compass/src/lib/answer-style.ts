import { useEffect, useState } from "react";

export const ANSWER_STYLES = [
  {
    id: "everything",
    label: "Show me everything",
    hint: "Every angle, no trimming",
    prompt:
      "The reader wants the full picture — do not trim for brevity. Cover it from every useful angle: the helicopter summary, the practical how-to, the technical details for anyone implementing, the plain-language framing, and the surrounding context (who owns it, related work, gotchas, where to go next). Use clear headings for each angle so the reader can jump around. Include code, links, and named artifacts where relevant.",
  },
  {
    id: "helicopter",
    label: "Helicopter view",
    hint: "One-paragraph gist, no jargon",
    prompt:
      "Answer at a helicopter / executive level. One short paragraph, plain language, no code, no jargon. Say what it is and why it matters. Skip implementation detail entirely.",
  },
  {
    id: "practical",
    label: "Practical guide",
    hint: "What most teammates want",
    prompt:
      "Answer for a typical practitioner: 2-3 short paragraphs or a tight bulleted list. Include the concrete steps or decision, name any relevant tool/service by role (not vendor), and skip deep internals unless critical.",
  },
  {
    id: "technical",
    label: "Technical deep-dive",
    hint: "Details for implementation",
    prompt:
      "Answer for an engineer implementing this. Be precise and specific: names of modules/files/functions where known, sequencing, edge cases, failure modes, and rollback. Use fenced code or shell blocks where useful. Do NOT dumb down.",
  },
  {
    id: "eli5",
    label: "Explain like I'm 5",
    hint: "Analogies, zero acronyms",
    prompt:
      "Answer as if the reader is completely new to the domain. Use a concrete real-world analogy first, then translate it. Expand every acronym on first use. Keep sentences short. No code.",
  },
  {
    id: "newhire",
    label: "New teammate",
    hint: "Onboarding-friendly with context",
    prompt:
      "Answer for someone in their first two weeks: give the background context they don't have yet (what team owns this, why it exists), then the answer, then a hint about who to talk to next.",
  },
] as const;

export type AnswerStyleId = (typeof ANSWER_STYLES)[number]["id"];

export const DEFAULT_STYLE: AnswerStyleId = "everything";

export function getStyle(id: string | null | undefined) {
  return ANSWER_STYLES.find((s) => s.id === id) ?? ANSWER_STYLES.find((s) => s.id === DEFAULT_STYLE)!;
}

const KEY = "switchboard.answerStyle.v1";

export function useAnswerStyle() {
  const [style, setStyle] = useState<AnswerStyleId>(DEFAULT_STYLE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(KEY) as AnswerStyleId | null;
    if (saved && ANSWER_STYLES.some((s) => s.id === saved)) setStyle(saved);
    setHydrated(true);
  }, []);

  const update = (next: AnswerStyleId) => {
    setStyle(next);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, next);
  };

  return { style, setStyle: update, hydrated };
}

const MULTI_KEY = "switchboard.answerStyles.v1";

export function useAnswerStyles() {
  const [styles, setStyles] = useState<AnswerStyleId[]>([DEFAULT_STYLE]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(MULTI_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as string[];
        const valid = parsed.filter((id): id is AnswerStyleId =>
          ANSWER_STYLES.some((s) => s.id === id),
        );
        if (valid.length) setStyles(valid);
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, []);

  const persist = (next: AnswerStyleId[]) => {
    setStyles(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MULTI_KEY, JSON.stringify(next));
    }
  };

  const toggleStyle = (id: AnswerStyleId) => {
    const next = styles.includes(id)
      ? styles.filter((s) => s !== id)
      : [...styles, id];
    // Never allow empty — fall back to default
    persist(next.length ? next : [DEFAULT_STYLE]);
  };

  return { styles, toggleStyle, setStyles: persist, hydrated };
}
