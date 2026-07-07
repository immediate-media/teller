import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, RotateCcw, Sparkle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ANSWER_STYLES, useAnswerStyle } from "@/lib/answer-style";
import { useMyProfile } from "@/lib/profile-store";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const WILLINGNESS = [
  { value: "happy", label: "Happy to help" },
  { value: "sparingly", label: "Ask sparingly" },
  { value: "no", label: "Not my area" },
] as const;

function ProfilePage() {
  const { profile, update, reset, hydrated } = useMyProfile();
  const { style, setStyle } = useAnswerStyle();
  const [newGap, setNewGap] = useState("");
  const [newTopic, setNewTopic] = useState("");

  const addTopic = () => {
    const trimmed = newTopic.trim();
    if (!trimmed) return;
    if (profile.expertise.some((x) => x.topic.toLowerCase() === trimmed.toLowerCase())) {
      toast("Already tracked", { description: `"${trimmed}" is already in your expertise.` });
      return;
    }
    update({
      expertise: [
        ...profile.expertise,
        { topic: trimmed, confidence: 0.5, evidence: "Added by you", willingness: "happy" },
      ],
    });
    setNewTopic("");
  };

  const setWillingness = (topic: string, willingness: "happy" | "sparingly" | "no") => {
    update({
      expertise: profile.expertise.map((x) => (x.topic === topic ? { ...x, willingness } : x)),
    });
  };

  const removeTopic = (topic: string) => {
    update({ expertise: profile.expertise.filter((x) => x.topic !== topic) });
    toast("Topic removed", { description: `"${topic}" won't be surfaced anymore.` });
  };

  const addGap = () => {
    const trimmed = newGap.trim();
    if (!trimmed) return;
    update({ gaps: [...profile.gaps, trimmed] });
    setNewGap("");
  };

  const removeGap = (gap: string) => {
    update({ gaps: profile.gaps.filter((g) => g !== gap) });
  };

  if (!hydrated) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-6 py-12" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
              <Sparkle className="size-3 text-[color:var(--teal)]" />
              AI-inferred profile · you can correct anything
            </div>
            <h1 className="mt-4 font-serif text-3xl">My profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Teller has guessed what you know based on tickets, docs, and reviews. Tune these
              so it routes questions to you accurately — and only when you want them.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
            <RotateCcw className="mr-1 size-3.5" /> Reset
          </Button>
        </div>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Inferred expertise
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Teller quietly gathers signal from the tools you already use — tickets, docs,
            code, chats. Recency and ownership are weighted heavily; old activity counts less
            than something you touched last week.
          </p>
          <div className="mt-3 space-y-3">
            <AnimatePresence initial={false}>
              {profile.expertise.map((x) => (
                <motion.div
                  key={x.topic}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{x.topic}</div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular">
                          {Math.round(x.confidence * 100)}% signal
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Evidence: {x.evidence}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {x.lastActive ? (
                          <span className="tabular">
                            Last touched <span className="text-foreground/80">{x.lastActive}</span>
                          </span>
                        ) : null}
                        {typeof x.activityCount === "number" ? (
                          <span className="tabular">
                            {x.activityCount} signals across your tools
                          </span>
                        ) : null}
                        {x.trend ? (
                          <span
                            className={
                              "rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider " +
                              (x.trend === "rising"
                                ? "border-[color:var(--teal)]/40 text-[color:var(--teal)]"
                                : x.trend === "cooling"
                                  ? "border-amber-500/40 text-amber-700 dark:text-amber-400"
                                  : "border-border text-muted-foreground")
                            }
                          >
                            {x.trend}
                          </span>
                        ) : null}
                        {x.collaborators && x.collaborators.length > 0 ? (
                          <span>
                            With <span className="text-foreground/80">{x.collaborators.join(", ")}</span>
                          </span>
                        ) : null}
                      </div>
                      {x.repos && x.repos.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {x.repos.map((r) => (
                            <span
                              key={r.name}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground tabular"
                              title={`${r.role ?? "contributor"} · ${r.commits30d} commits in last 30d`}
                            >
                              <span className="font-mono text-foreground/80">{r.name}</span>
                              <span>· {r.lastCommit}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <button
                      onClick={() => removeTopic(x.topic)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label={`Remove ${x.topic}`}
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 h-1 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-foreground/70"
                      style={{ width: `${Math.round(x.confidence * 100)}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {WILLINGNESS.map((w) => {
                      const active = x.willingness === w.value;
                      return (
                        <button
                          key={w.value}
                          onClick={() => setWillingness(x.topic, w.value)}
                          className={
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors " +
                            (active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-card text-muted-foreground hover:border-foreground/40")
                          }
                        >
                          {active ? <Check className="size-3" /> : null}
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTopic();
              }}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3"
            >
              <Plus className="size-4 text-muted-foreground" />
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Add an area of expertise…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
              <Button type="submit" size="sm" variant="ghost" disabled={!newTopic.trim()}>
                Add
              </Button>
            </form>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Knowledge gaps I'm working on
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Helps Teller suggest onboarding pairs — people who know what you're learning.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.gaps.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
              >
                {g}
                <button
                  onClick={() => removeGap(g)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove gap ${g}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addGap();
              }}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-card px-2.5 py-1"
            >
              <input
                value={newGap}
                onChange={(e) => setNewGap(e.target.value)}
                placeholder="Add a topic…"
                className="bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
              />
              <button type="submit" className="text-muted-foreground hover:text-foreground" aria-label="Add gap">
                <Plus className="size-3.5" />
              </button>
            </form>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Default answer style
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            How Teller shapes answers for you. You can change this per question on the Ask page.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ANSWER_STYLES.map((s) => {
              const active = s.id === style;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={
                    "rounded-xl border p-3 text-left transition-colors " +
                    (active
                      ? "border-foreground bg-secondary/60"
                      : "border-border bg-card hover:border-foreground/40")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{s.label}</div>
                    {active ? <Check className="size-3.5 text-foreground" /> : null}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>
                </button>
              );
            })}
          </div>
        </section>


        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preferences
          </h2>
          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <div className="text-sm font-medium">Prefer async questions</div>
                <div className="text-xs text-muted-foreground">
                  Prompts people to leave a message instead of DMing you live.
                </div>
              </div>
              <Switch
                checked={profile.preferences.async}
                onCheckedChange={(v) => update({ preferences: { ...profile.preferences, async: v } })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <div className="text-sm font-medium">Best hours</div>
                <div className="text-xs text-muted-foreground">
                  When you'd rather be interrupted, if it can wait.
                </div>
              </div>
              <input
                value={profile.preferences.bestHours}
                onChange={(e) =>
                  update({ preferences: { ...profile.preferences, bestHours: e.target.value } })
                }
                className="w-52 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 tabular"
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <div className="text-sm font-medium">Open to onboarding chats</div>
                <div className="text-xs text-muted-foreground">
                  Surface me to new hires learning topics I know well.
                </div>
              </div>
              <Switch
                checked={profile.preferences.openToOnboarding}
                onCheckedChange={(v) =>
                  update({ preferences: { ...profile.preferences, openToOnboarding: v } })
                }
              />
            </div>
          </div>
        </section>

        <div className="mt-10 flex justify-end">
          <Button
            onClick={() => toast.success("Profile saved", { description: "Teller will use this immediately." })}
          >
            Save changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
