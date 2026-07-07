type Props = {
  title: string
  children: React.ReactNode
}

export function BriefingSection({ title, children }: Props) {
  return (
    <section className="border border-border rounded-xl p-5 bg-card shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      {children}
    </section>
  )
}
