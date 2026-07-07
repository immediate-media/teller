import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookmarkCheck,
  CheckCircle2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { ThinkingBubbles } from "@/components/ThinkingBubbles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PersonCard } from "@/components/PersonCard";
import { RefineFilters } from "@/components/RefineFilters";
import { SourceCard } from "@/components/SourceCard";
import { Button } from "@/components/ui/button";
import { useAnswerPreference } from "@/lib/answer-preference";
import { useAnswerStyles } from "@/lib/answer-style";
import { askQuestion, type AskResult } from "@/lib/ask.functions";
import { getDoc } from "@/lib/mock/docs";
import { getEmployee } from "@/lib/mock/employees";
import { useRoleLenses, type RoleLensId } from "@/lib/role-lens";

export const Route = createFileRoute("/answer/$id")({
  component: AnswerPage,
});

function AnswerPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const ask = useServerFn(askQuestion);

  const [question, setQuestion] = useState<string | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [dirty, setDirty] = useState(false);

  const { styles, setStyles } = useAnswerStyles();
  const { roles, setRoles } = useRoleLenses();
  const { preference, setPreference } = useAnswerPreference();

  const runAsk = useCallback(
    (q: string, opts: { styles: string[]; roles: string[]; preference: string }) => {
      setLoading(true);
      setError(null);
      ask({
        data: {
          question: q,
          ...(opts.styles.length ? { styles: opts.styles } : {}),
          ...(opts.roles.length ? { roles: opts.roles } : {}),
          ...(opts.preference ? { preference: opts.preference } : {}),
        },
      })
        .then((res) => {
          setResult(res);
          setFeedback(null);
          setDirty(false);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"))
        .finally(() => setLoading(false));
    },
    [ask],
  );

  // Load once from sessionStorage (per-question snapshot), hydrate hooks
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const q = typeof window !== "undefined" ? window.sessionStorage.getItem(`switchboard.question.${id}`) : null;
    const stylesRaw = typeof window !== "undefined" ? window.sessionStorage.getItem(`switchboard.styles.${id}`) : null;
    const rolesRaw = typeof window !== "undefined" ? window.sessionStorage.getItem(`switchboard.roles.${id}`) : null;
    const pref = typeof window !== "undefined" ? window.sessionStorage.getItem(`switchboard.preference.${id}`) : null;
    let sList: string[] = [];
    let rList: string[] = [];
    try {
      if (stylesRaw) {
        const parsed = JSON.parse(stylesRaw);
        if (Array.isArray(parsed)) sList = parsed;
      }
    } catch { /* ignore */ }
    try {
      if (rolesRaw) {
        const parsed = JSON.parse(rolesRaw);
        if (Array.isArray(parsed)) rList = parsed;
      }
    } catch { /* ignore */ }

    if (!q) {
      navigate({ to: "/" });
      return;
    }
    setQuestion(q);
    if (sList.length) setStyles(sList as typeof styles);
    if (rList.length) setRoles(rList as RoleLensId[]);
    if (pref) setPreference(pref as typeof preference);

    runAsk(q, { styles: sList, roles: rList, preference: pref ?? "auto" });
  }, [id, navigate, runAsk, setStyles, setRoles, setPreference, styles, preference]);

  // Detect filter changes after initial load
  useEffect(() => {
    if (!question) return;
    setDirty(true);
  }, [styles, roles, preference, question]);

  const rerun = () => {
    if (!question) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`switchboard.styles.${id}`, JSON.stringify(styles));
      window.sessionStorage.setItem(`switchboard.roles.${id}`, JSON.stringify(roles));
      window.sessionStorage.setItem(`switchboard.preference.${id}`, preference);
    }
    runAsk(question, { styles, roles, preference });
  };

  const sendFeedback = (kind: "up" | "down") => {
    setFeedback(kind);
    toast.success(kind === "up" ? "Thanks — glad this helped." : "Thanks — we'll tune this.", {
      description: kind === "up"
        ? "Signal recorded against this answer."
        : "Try refining the filters above to reshape it.",
    });
  };

  const sources = useMemo(
    () => (result?.sourceIds ?? []).map((sid) => getDoc(sid)).filter((d): d is NonNullable<ReturnType<typeof getDoc>> => !!d),
    [result],
  );
  const people = useMemo(
    () =>
      (result?.peopleIds ?? [])
        .map((pid) => getEmployee(pid))
        .filter((p): p is NonNullable<ReturnType<typeof getEmployee>> => !!p && p.id !== "e-you"),
    [result],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-10 md:py-14">
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-4 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="mr-1 size-4" /> New question
          </Link>
        </Button>

        {question ? (
          <h1 className="font-serif text-2xl leading-snug md:text-3xl">{question}</h1>
        ) : null}

        {/* Prominent refine panel — trim the answer without leaving the page */}
        <div className="mt-5 rounded-xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Trim this answer
            </p>
            <Button
              size="sm"
              variant={dirty ? "default" : "outline"}
              onClick={rerun}
              disabled={loading}
            >
              <RefreshCw className={"mr-1.5 size-3.5 " + (loading ? "animate-spin" : "")} />
              {dirty ? "Update answer" : "Re-run"}
            </Button>
          </div>
          <RefineFilters size="md" />
        </div>

        {loading ? <ThinkingBubbles /> : null}

        {error ? (
          <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <AnimatePresence>
          {result && !loading ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6 space-y-10"
            >
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={
                      result.hasDocAnswer
                        ? "inline-flex items-center gap-1 rounded-full bg-[color:var(--teal-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--accent-foreground)]"
                        : "inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {result.hasDocAnswer ? "Answer found in docs" : "No doc match — routing to people"}
                  </span>
                  <span className="text-xs text-muted-foreground italic">{result.reasoning}</span>
                </div>
                <div className="rounded-xl border border-border bg-card p-6 text-foreground">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                    {result.answer}
                  </div>

                  {/* Accuracy feedback — inside the answer box */}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      {feedback === "up"
                        ? "Thanks — noted this hit the mark."
                        : feedback === "down"
                          ? "Thanks — try tightening the filters above."
                          : "Was this answer accurate?"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => sendFeedback("up")}
                        aria-label="Accurate"
                        aria-pressed={feedback === "up"}
                        className={
                          "inline-flex size-8 items-center justify-center rounded-full border transition-colors " +
                          (feedback === "up"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary")
                        }
                      >
                        <ThumbsUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => sendFeedback("down")}
                        aria-label="Not accurate"
                        aria-pressed={feedback === "down"}
                        className={
                          "inline-flex size-8 items-center justify-center rounded-full border transition-colors " +
                          (feedback === "down"
                            ? "border-destructive bg-destructive text-destructive-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-destructive/50 hover:text-destructive")
                        }
                      >
                        <ThumbsDown className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>


                {result.hasDocAnswer ? (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-border bg-secondary/40 px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      {captured
                        ? "Captured back to Confluence · Growth / Team Q&A"
                        : "Save this answer back to Confluence so the next person doesn't have to ask."}
                    </p>
                    <Button
                      size="sm"
                      variant={captured ? "outline" : "default"}
                      disabled={captured}
                      onClick={() => {
                        setCaptured(true);
                        toast.success("Captured to Confluence", {
                          description: "Filed under Growth / Team Q&A — tagged for retrieval.",
                        });
                      }}
                    >
                      {captured ? (
                        <>
                          <CheckCircle2 className="mr-1 size-4" /> Captured
                        </>
                      ) : (
                        <>
                          <BookmarkCheck className="mr-1 size-4" /> Save to Confluence
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </section>

              {sources.length ? (
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sources
                  </h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {sources.map((d) => (
                      <SourceCard key={d.id} doc={d} />
                    ))}
                  </div>
                </section>
              ) : null}

              {people.length ? (
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    People who might know
                  </h2>
                  <div className="grid gap-4">
                    {people.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * i }}
                      >
                        <PersonCard person={p} rationale={rationaleFor(p.id, question)} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function rationaleFor(personId: string, question: string | null) {
  const p = getEmployee(personId);
  if (!p || !question) return undefined;
  const q = question.toLowerCase();
  const match = p.expertise.find((x) => q.includes(x.topic.toLowerCase().split(" ")[0]));
  if (match) {
    return `${match.evidence}. Marked "${match.willingness === "happy" ? "happy to help" : match.willingness === "sparingly" ? "ask sparingly" : "not my area"}" on ${match.topic}.`;
  }
  const top = p.expertise[0];
  return top ? `${top.evidence}. Closest topic: ${top.topic}.` : undefined;
}
