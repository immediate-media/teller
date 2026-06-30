type Props = {
  title: string
  children: React.ReactNode
}

export function BriefingSection({ title, children }: Props) {
  return (
    <section className="border border-zinc-800 rounded-lg p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">{title}</h2>
      {children}
    </section>
  )
}
