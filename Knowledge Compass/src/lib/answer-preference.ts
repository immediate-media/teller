import { useEffect, useState } from "react";
import { FileText, Sparkles, Users } from "lucide-react";

export const ANSWER_PREFERENCES = [
  {
    id: "auto",
    label: "Auto",
    hint: "Let Teller decide",
    icon: Sparkles,
    prompt:
      "The reader has no preference — answer from documents when a doc clearly covers it, otherwise route them to a person. Use your best judgement.",
  },
  {
    id: "people",
    label: "A person",
    hint: "Prefer routing to a human",
    icon: Users,
    prompt:
      "The reader would rather talk to a person than read a doc. Even if a document covers the question, keep the written answer short (2-3 sentences) and put the emphasis on the recommended people. Suggest 2-3 people in peopleIds.",
  },
  {
    id: "docs",
    label: "Documents",
    hint: "Prefer written sources",
    icon: FileText,
    prompt:
      "The reader would rather read documents than message a person. Lead with the doc-based answer and cite doc ids in sourceIds. Only suggest people if no document reasonably covers the question.",
  },
] as const;

export type AnswerPreferenceId = (typeof ANSWER_PREFERENCES)[number]["id"];

export const DEFAULT_PREFERENCE: AnswerPreferenceId = "auto";

export function getPreference(id: string | null | undefined) {
  return (
    ANSWER_PREFERENCES.find((p) => p.id === id) ??
    ANSWER_PREFERENCES.find((p) => p.id === DEFAULT_PREFERENCE)!
  );
}

const KEY = "teller.answerPreference.v1";

export function useAnswerPreference() {
  const [preference, setPreference] = useState<AnswerPreferenceId>(DEFAULT_PREFERENCE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(KEY) as AnswerPreferenceId | null;
    if (saved && ANSWER_PREFERENCES.some((p) => p.id === saved)) setPreference(saved);
    setHydrated(true);
  }, []);

  const update = (next: AnswerPreferenceId) => {
    setPreference(next);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, next);
  };

  return { preference, setPreference: update, hydrated };
}
