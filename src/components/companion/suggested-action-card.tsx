'use client'
import { Button } from '@/components/ui/button'
import { SuggestedAction } from '@/types'

interface SuggestedActionCardProps {
  action: SuggestedAction
  onAccept: () => void
  onAdjust: () => void
  onDismiss: () => void
}

function readString(payload: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = payload?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

/** e.g. "Reach out to someone · Once every 3 days" */
function describeProposal(action: SuggestedAction): string | undefined {
  if (action.type !== 'create_habit') return undefined
  const name = readString(action.payload, 'name')
  const cadence = readString(action.payload, 'cadence')
  if (!name) return cadence
  return cadence ? `${name} · ${cadence}` : name
}

export function SuggestedActionCard({
  action,
  onAccept,
  onAdjust,
  onDismiss,
}: SuggestedActionCardProps) {
  const proposal = describeProposal(action)

  return (
    <div className="space-y-3 rounded-3xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
      <p className="text-xs font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
        Suggestion
      </p>

      <div className="space-y-1">
        <p className="text-sm font-medium leading-snug">{action.label}</p>
        {proposal && <p className="text-sm text-muted-foreground">{proposal}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={onAccept} aria-label={`Add it: ${action.label}`}>
          Add it
        </Button>
        <Button variant="outline" size="sm" onClick={onAdjust} aria-label={`Adjust: ${action.label}`}>
          Adjust
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss} aria-label={`Not now: ${action.label}`}>
          Not now
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">Nothing changes unless you say so.</p>
    </div>
  )
}
