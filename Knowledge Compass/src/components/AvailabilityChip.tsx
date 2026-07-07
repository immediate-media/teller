import { cn } from "@/lib/utils";
import type { Availability } from "@/lib/mock/employees";

const LABELS: Record<Availability, string> = {
  open: "Open to pings",
  focused: "Heads-down",
  away: "Away",
};

const STYLES: Record<Availability, string> = {
  open: "bg-[color:var(--status-open)]/12 text-[color:var(--status-open)] ring-[color:var(--status-open)]/25",
  focused:
    "bg-[color:var(--status-focused)]/15 text-[color:var(--status-focused)] ring-[color:var(--status-focused)]/30",
  away: "bg-[color:var(--status-away)]/12 text-[color:var(--status-away)] ring-[color:var(--status-away)]/25",
};

export function AvailabilityChip({
  availability,
  className,
}: {
  availability: Availability;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        STYLES[availability],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          availability === "open" && "bg-[color:var(--status-open)]",
          availability === "focused" && "bg-[color:var(--status-focused)]",
          availability === "away" && "bg-[color:var(--status-away)]",
        )}
      />
      {LABELS[availability]}
    </span>
  );
}
