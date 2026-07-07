import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, MessageSquare } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { AvailabilityChip } from "@/components/AvailabilityChip";
import { Button } from "@/components/ui/button";
import { getEmployee, type Employee } from "@/lib/mock/employees";

export const Route = createFileRoute("/people/$id")({
  loader: ({ params }) => {
    const person = getEmployee(params.id);
    if (!person) throw notFound();
    return { person };
  },
  component: PersonPage,
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-serif text-2xl">We can't find that person</h1>
        <Button asChild className="mt-6">
          <Link to="/people">Back to directory</Link>
        </Button>
      </div>
    </AppShell>
  ),
});

function PersonPage() {
  const { person } = Route.useLoaderData() as { person: Employee };
  const initials = person.name
    .replace(/\(.*\)/, "")
    .trim()
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-4 text-muted-foreground">
          <Link to="/people">
            <ArrowLeft className="mr-1 size-4" /> Directory
          </Link>
        </Button>

        <div className="flex items-start gap-5 border-b border-border pb-8">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[color:var(--teal-soft)] text-lg font-semibold text-[color:var(--accent-foreground)]">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl">{person.name}</h1>
              <AvailabilityChip availability={person.availability} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {person.role} · {person.team} · {person.timezone}
            </p>
            <p className="mt-2 text-sm tabular">{person.slackStatus}</p>
          </div>
          <Button disabled={person.availability === "away"}>
            <MessageSquare className="mr-1 size-4" /> Ask {person.name.split(" ")[0]}
          </Button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hours</div>
            <div className="mt-2 text-sm tabular">{person.workingHours}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Best reached</div>
            <div className="mt-2 text-sm tabular">{person.preferences.bestHours}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Response</div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground tabular">
              <Clock className="size-3.5" /> {person.typicalResponse}
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Expertise
          </h2>
          <div className="mt-3 space-y-2">
            {person.expertise.map((x) => (
              <div
                key={x.topic}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{x.topic}</div>
                  <div className="text-xs text-muted-foreground">{x.evidence}</div>
                </div>
                <div className="hidden w-32 sm:block">
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-foreground/70"
                      style={{ width: `${Math.round(x.confidence * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[10px] text-muted-foreground tabular">
                    {Math.round(x.confidence * 100)}% signal
                  </div>
                </div>
                <span
                  className={
                    x.willingness === "happy"
                      ? "shrink-0 rounded-full bg-[color:var(--status-open)]/15 px-2 py-0.5 text-[11px] text-[color:var(--status-open)]"
                      : x.willingness === "sparingly"
                        ? "shrink-0 rounded-full bg-[color:var(--status-focused)]/20 px-2 py-0.5 text-[11px] text-[color:var(--status-focused)]"
                        : "shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                  }
                >
                  {x.willingness === "happy" ? "happy to help" : x.willingness === "sparingly" ? "ask sparingly" : "not my area"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {person.recentActivity.map((a) => (
              <div key={a.ref} className="flex items-center gap-3 px-4 py-3">
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {a.type}
                </span>
                <span className="text-xs text-muted-foreground tabular">{a.ref}</span>
                <span className="flex-1 truncate text-sm">{a.title}</span>
                <span className="text-xs text-muted-foreground tabular">{a.when}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
