import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type FilterOption = { id: string; label: string; hint?: string };

export function FilterMenu({
  label,
  value,
  isDefault,
  options,
  selected,
  multi,
  onSelect,
  size = "sm",
}: {
  label: string;
  value: string;
  isDefault: boolean;
  options: FilterOption[];
  selected: string[];
  multi?: boolean;
  onSelect: (id: string) => void;
  size?: "sm" | "md";
}) {
  const trigger =
    size === "md"
      ? "gap-2 px-3 py-1.5 text-sm"
      : "gap-1.5 px-2.5 py-1 text-xs";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            "inline-flex items-center rounded-full border transition-colors " +
            trigger +
            " " +
            (isDefault
              ? "border-border bg-card text-muted-foreground hover:border-foreground/40"
              : "border-foreground/60 bg-card text-foreground hover:border-foreground")
          }
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1">
        {multi && (
          <p className="px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Pick one or more
          </p>
        )}
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o.id)}
              className={
                "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors " +
                (active ? "bg-secondary" : "hover:bg-secondary/60")
              }
            >
              <span
                aria-hidden
                className={
                  "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors " +
                  (active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background")
                }
              >
                {active ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="flex-1">
                <span className="block leading-tight">{o.label}</span>
                {o.hint && (
                  <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
                )}
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
