import type { BriefingStatus } from '@/types'

const STATUS_CONFIG: Record<BriefingStatus, { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'in-review': { label: 'In Review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  deprecated: { label: 'Deprecated', className: 'bg-muted text-muted-foreground border-border' },
}

export function StatusBadge({ status }: { status: BriefingStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['in-progress']
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
