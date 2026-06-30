import type { BriefingStatus } from '@/types'

const STATUS_CONFIG: Record<BriefingStatus, { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
  'in-review': { label: 'In Review', className: 'bg-amber-950 text-amber-400 border-amber-800' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-950 text-blue-400 border-blue-800' },
  deprecated: { label: 'Deprecated', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
}

export function StatusBadge({ status }: { status: BriefingStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['in-progress']
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
