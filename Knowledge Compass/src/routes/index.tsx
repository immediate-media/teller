import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Search, SlidersHorizontal, Users } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RefineFilters } from "@/components/RefineFilters";
import { Button } from "@/components/ui/button";
import {
  useAnswerPreference,
  type AnswerPreferenceId,
} from "@/lib/answer-preference";
import { useAnswerStyles } from "@/lib/answer-style";
import { recentQuestions, sampleQuestions } from "@/lib/mock/sample-questions";
import { useRoleLenses } from "@/lib/role-lens";

export const Route = createFileRoute("/")({
  component: AskPage,
});

function AskPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [refineOpen, setRefineOpen] = useState(false);
  const [showAllSamples, setShowAllSamples] = useState(false);
  const { styles } = useAnswerStyles();
  const { roles } = useRoleLenses();
  const { preference } = useAnswerPreference();

  const activeCount =
    (styles.length === 1 && styles[0] === "everything" ? 0 : 1) +
    (roles.length > 0 ? 1 : 0) +
    (preference !== "auto" ? 1 : 0);

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const id = `q-${Date.now().toString(36)}`;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`switchboard.question.${id}`, trimmed);
      window.sessionStorage.setItem(`switchboard.styles.${id}`, JSON.stringify(styles));
      window.sessionStorage.setItem(`switchboard.roles.${id}`, JSON.stringify(roles));
      window.sessionStorage.setItem(`switchboard.preference.${id}`, preference);
    }
    navigate({ to: "/answer/$id", params: { id } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-brand-gradient mb-5 h-1.5 w-24 rounded-full" />
          <h1 className="whitespace-nowrap font-display font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-[clamp(1.25rem,5.2vw,3rem)]">
            What are you trying to <span className="text-brand-gradient">figure out?</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-10"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(question);
            }}
            role="search"
            aria-label="Ask a question"
            className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 focus-within:border-foreground/40 focus-within:bg-card"
          >
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <label htmlFor="ask-question" className="sr-only">
              Ask a question
            </label>
            <input
              id="ask-question"
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="type away, try me"
              className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!question.trim()}
              aria-label={question.trim() ? `Ask: ${question.trim()}` : "Ask"}
              aria-disabled={!question.trim()}
              className="min-h-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>Ask</span>
              <ArrowRight aria-hidden="true" className="ml-1 size-3.5" />
            </Button>
          </form>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setRefineOpen((v) => !v)}
              aria-expanded={refineOpen}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
            >
              <SlidersHorizontal className="size-3" />
              Refine search
              {activeCount > 0 && (
                <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                  {activeCount}
                </span>
              )}
            </button>
            {refineOpen && (
              <div className="mt-3 rounded-lg border border-border bg-card/60 p-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Advanced search options
                </p>
                <RefineFilters />
              </div>
            )}
          </div>

          <ResponsePlaceholder preference={preference} />
        </motion.div>

        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Just browsing out of curiosity? Try one of these
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(showAllSamples ? sampleQuestions : sampleQuestions.slice(0, 3)).map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-sm text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-secondary"
              >
                {q}
              </button>
            ))}
            {sampleQuestions.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllSamples((v) => !v)}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {showAllSamples ? "Show less" : `See more (${sampleQuestions.length - 3})`}
              </button>
            )}
          </div>
        </div>


        <div className="mt-14">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent across the team
          </p>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {recentQuestions.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={
                    r.resolved
                      ? "size-1.5 shrink-0 rounded-full bg-[color:var(--status-open)]"
                      : "size-1.5 shrink-0 rounded-full bg-[color:var(--status-focused)]"
                  }
                />
                <p className="flex-1 truncate text-sm">{r.text}</p>
                <span className="text-xs text-muted-foreground tabular">{r.asked}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.resolved ? "captured" : "open"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ResponsePlaceholder({ preference }: { preference: AnswerPreferenceId }) {
  const showDocs = preference !== "people";
  const showPeople = preference !== "docs";
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border bg-card/40 p-5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Your answer will appear here
      </p>

      <div className="mt-3 space-y-1.5">
        <div className="h-2 w-11/12 rounded bg-muted" />
        <div className="h-2 w-9/12 rounded bg-muted" />
        <div className="h-2 w-7/12 rounded bg-muted" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {showDocs && (
          <div className={"rounded-lg border border-border bg-background/60 p-3 " + (preference === "docs" ? "ring-1 ring-foreground/30" : "")}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <FileText className="size-3" />
              Sources
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-2 w-10/12 rounded bg-muted" />
              <div className="h-2 w-8/12 rounded bg-muted" />
            </div>
          </div>
        )}
        {showPeople && (
          <div className={"rounded-lg border border-border bg-background/60 p-3 " + (preference === "people" ? "ring-1 ring-foreground/30" : "")}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Users className="size-3" />
              People who might know
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="size-6 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-2 w-6/12 rounded bg-muted" />
                <div className="h-1.5 w-4/12 rounded bg-muted/70" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
