import { Link, useLocation } from "@tanstack/react-router";
import { CircleUser, MessageCircleQuestion, Users, UserCog } from "lucide-react";

import { cn } from "@/lib/utils";
import { currentUserId, getEmployee } from "@/lib/mock/employees";

const NAV = [
  { to: "/", label: "Ask", icon: MessageCircleQuestion },
  { to: "/people", label: "People", icon: Users },
  { to: "/profile", label: "My profile", icon: UserCog },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const me = getEmployee(currentUserId)!;
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
            <div className="bg-brand-gradient flex size-8 items-center justify-center rounded-md text-primary-foreground shadow-sm">
              <span className="font-display text-[13px] font-extrabold tracking-tight">IM</span>
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-extrabold uppercase tracking-[0.08em]">
                Immediate
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                a Burda company
              </div>
            </div>
          </Link>

          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/" || pathname.startsWith("/answer")
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-foreground"
                      : "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2.5">
              <CircleUser className="size-8 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{me.name.replace(/^You \((.*)\)$/, "$1")}</div>
                <div className="truncate text-xs text-muted-foreground">{me.team}</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
