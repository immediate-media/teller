'use client'

import { BookOpen, History } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SideMode = 'ask' | 'history'

const NAV = [
  { id: 'ask' as const, label: 'Ask', icon: BookOpen },
  { id: 'history' as const, label: 'History', icon: History },
]

type Props = {
  children: React.ReactNode
  mode: SideMode
  onModeChange: (mode: SideMode) => void
}

export function AppShell({ children, mode, onModeChange }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
          <div className="mb-8 flex items-center gap-2.5 px-2">
            <div className="bg-brand-gradient flex size-8 items-center justify-center rounded-md text-white shadow-sm">
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
          </div>

          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onModeChange(id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors text-left',
                  mode === id
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-medium text-foreground">Project Teller</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Internal tool</p>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="flex md:hidden fixed top-0 inset-x-0 z-10 bg-sidebar border-b border-border px-4 py-3 gap-3 items-center">
          <div className="bg-brand-gradient flex size-7 items-center justify-center rounded text-white">
            <span className="font-display text-[11px] font-extrabold">IM</span>
          </div>
          {NAV.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={cn(
                'text-sm px-3 py-1 rounded-full transition-colors',
                mode === id
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <main className="min-w-0 flex-1 pt-14 md:pt-0">{children}</main>
      </div>
    </div>
  )
}
