const SEVERITY_CONFIG = {
  high: { label: 'High', className: 'text-red-400 border-red-800 bg-red-950' },
  medium: { label: 'Medium', className: 'text-amber-400 border-amber-800 bg-amber-950' },
  low: { label: 'Low', className: 'text-zinc-400 border-zinc-700 bg-zinc-800' },
}

type Props = {
  risk: string
  severity: 'high' | 'medium' | 'low'
}

export function RiskRow({ risk, severity }: Props) {
  const config = SEVERITY_CONFIG[severity]
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800 last:border-0">
      <span className={`mt-0.5 inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
      <p className="text-sm text-zinc-300">{risk}</p>
    </div>
  )
}
