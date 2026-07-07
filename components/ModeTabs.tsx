export type Mode = 'briefing' | 'expertise' | 'history'

type Props = {
  mode: Mode
  onChange: (mode: Mode) => void
}

const TABS: { id: Mode; label: string }[] = [
  { id: 'briefing', label: 'Brief me on a project' },
  { id: 'expertise', label: 'Who to talk to' },
  { id: 'history', label: 'History' },
]

export function ModeTabs({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border border-zinc-800 p-1 mb-8">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === tab.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
