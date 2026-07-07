import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MessageSquare } from "lucide-react";

import { AvailabilityChip } from "./AvailabilityChip";
import type { Employee } from "@/lib/mock/employees";
import { Button } from "@/components/ui/button";

export function PersonCard({
  person,
  rationale,
}: {
  person: Employee;
  rationale?: string;
}) {
  const initials = person.name
    .replace(/\(.*\)/, "")
    .trim()
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)]">
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--teal-soft)] text-sm font-semibold text-[color:var(--accent-foreground)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-medium text-foreground">{person.name}</h3>
            <AvailabilityChip availability={person.availability} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {person.role} · {person.team}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular">{person.slackStatus}</p>
        </div>
      </div>

      {rationale ? (
        <p className="mt-4 rounded-md bg-secondary/60 px-3 py-2 text-sm text-foreground/80">
          <span className="font-medium text-foreground">Why suggested:</span> {rationale}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {person.expertise.slice(0, 3).map((x) => (
          <span
            key={x.topic}
            className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
          >
            {x.topic}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular">{person.typicalResponse}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/people/$id" params={{ id: person.id }}>
              View profile <ArrowUpRight className="ml-1 size-3.5" />
            </Link>
          </Button>
          <Button size="sm" disabled={person.availability === "away"}>
            <MessageSquare className="mr-1 size-3.5" />
            Ask {person.name.split(" ")[0]}
          </Button>
        </div>
      </div>
    </div>
  );
}
