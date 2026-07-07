import { FileText, TicketIcon } from "lucide-react";

import type { DocSource } from "@/lib/mock/docs";

export function SourceCard({ doc }: { doc: DocSource }) {
  const Icon = doc.kind === "confluence" ? FileText : TicketIcon;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {doc.kind}
            </span>
            <span className="text-[10px] text-muted-foreground tabular">· {doc.space}</span>
            <span className="ml-auto text-[10px] text-muted-foreground tabular">{doc.updated}</span>
          </div>
          <h4 className="mt-1 text-sm font-medium leading-snug text-foreground">{doc.title}</h4>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.snippet}</p>
        </div>
      </div>
    </div>
  );
}
