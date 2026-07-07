import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { AvailabilityChip } from "@/components/AvailabilityChip";
import { employees } from "@/lib/mock/employees";

export const Route = createFileRoute("/people/")({
  component: PeopleIndex,
});

function PeopleIndex() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-serif text-3xl">People</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everyone in the mocked directory. Availability is a live signal — respect the amber and red.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {employees.map((p) => (
            <Link
              key={p.id}
              to="/people/$id"
              params={{ id: p.id }}
              className="group rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-[0_6px_20px_-12px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.role} · {p.team}
                  </div>
                </div>
                <AvailabilityChip availability={p.availability} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.expertise.slice(0, 3).map((x) => (
                  <span
                    key={x.topic}
                    className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {x.topic}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
