const SEVERITY_CONFIG = {
  high: { label: 'High', className: 'text-red-700 border-red-200 bg-red-50' },
  medium: { label: 'Medium', className: 'text-amber-700 border-amber-200 bg-amber-50' },
  low: { label: 'Low', className: 'text-muted-foreground border-border bg-muted' },
}

type Props = {
  risk: string
  severity: 'high' | 'medium' | 'low'
}

export function RiskRow({ risk, severity }: Props) {
  const config = SEVERITY_CONFIG[severity]
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className={`mt-0.5 inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
      <p className="text-sm text-foreground/80">{risk}</p>
    </div>
  )
}
