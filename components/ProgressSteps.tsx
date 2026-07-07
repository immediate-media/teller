type Step = { message: string; active: boolean }

type Props = {
  steps: Step[]
}

export function ProgressSteps({ steps }: Props) {
  if (steps.length === 0) return null
  return (
    <div className="space-y-2 mt-4">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2.5">
          {step.active ? (
            <span className="shrink-0 w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin inline-block" />
          ) : (
            <span className="shrink-0 text-xs text-emerald-500">✓</span>
          )}
          <span className={`text-xs ${step.active ? 'text-zinc-200' : 'text-zinc-500'}`}>
            {step.message}
          </span>
        </div>
      ))}
    </div>
  )
}

export type { Step }
