'use client'

import { Check, Pencil } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { IdentityAccent } from '@/types'
import {
  EFFORT_LABELS,
  FREQUENCY_LABELS,
  FREQUENCY_OPTIONS,
  formatTargetLine,
  type HabitDraft,
  type HabitSuggestion,
} from './suggestions'

interface StepHabitsProps {
  suggestions: HabitSuggestion[]
  selectedIds: string[]
  drafts: Record<string, HabitDraft>
  editingId: string | null
  onToggle: (id: string) => void
  onEditToggle: (id: string) => void
  onDraftChange: (id: string, patch: Partial<HabitDraft>) => void
}

/**
 * Badge styling is inlined rather than using <Badge>, because these sit inside
 * a <button> and only phrasing content is valid there.
 */
const badgeBase = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

const ACCENT_BADGE: Record<IdentityAccent, string> = {
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function StepHabits({
  suggestions,
  selectedIds,
  drafts,
  editingId,
  onToggle,
  onEditToggle,
  onDraftChange,
}: StepHabitsProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">Pick your first steps</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Small enough that consistency is easier than skipping.
        </p>
      </header>

      {suggestions.length === 0 && (
        <p className="rounded-3xl border border-dashed border-border p-6 text-sm leading-relaxed text-muted-foreground">
          Choose a direction first, and we&apos;ll suggest a few small starts here.
        </p>
      )}

      <ul className="space-y-3">
        {suggestions.map((suggestion) => {
          const draft = drafts[suggestion.id] ?? {
            target: suggestion.target,
            frequency: suggestion.frequency,
          }
          const isSelected = selectedIds.includes(suggestion.id)
          const isEditing = editingId === suggestion.id
          const editorId = `habit-editor-${suggestion.id}`

          return (
            <li
              key={suggestion.id}
              className={cn(
                'relative rounded-3xl border p-4 transition-colors',
                isSelected
                  ? 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
                  : 'border-border bg-card'
              )}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(suggestion.id)}
                className={cn('w-full rounded-2xl text-left', focusRing)}
              >
                <div className="flex items-start gap-3 pr-9">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isSelected
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-border bg-card'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>

                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span className="block font-medium">{suggestion.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatTargetLine(draft.target, suggestion.unit, draft.frequency)}
                    </span>
                    <span className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className={cn(badgeBase, 'border border-border text-muted-foreground')}>
                        {EFFORT_LABELS[suggestion.effortLevel]}
                      </span>
                      <span className={cn(badgeBase, ACCENT_BADGE[suggestion.identityAccent])}>
                        {suggestion.identityName}
                      </span>
                    </span>
                    <span className="block pt-0.5 text-xs italic leading-relaxed text-muted-foreground">
                      Small enough to make consistency easier.
                    </span>
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onEditToggle(suggestion.id)}
                aria-label={`Edit ${suggestion.name}`}
                aria-expanded={isEditing}
                aria-controls={editorId}
                className={cn(
                  'absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors',
                  'hover:bg-secondary hover:text-foreground active:scale-[0.98]',
                  focusRing,
                  isEditing && 'bg-secondary text-foreground'
                )}
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </button>

              {isEditing && (
                <div
                  id={editorId}
                  className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${editorId}-target`}
                      className="block text-xs font-medium text-muted-foreground"
                    >
                      Target ({suggestion.unit})
                    </label>
                    <Input
                      id={`${editorId}-target`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={draft.target}
                      onChange={(event) => {
                        const next = Number.parseInt(event.target.value, 10)
                        onDraftChange(suggestion.id, {
                          target: Number.isNaN(next) ? 1 : Math.max(1, next),
                        })
                      }}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${editorId}-frequency`}
                      className="block text-xs font-medium text-muted-foreground"
                    >
                      How often
                    </label>
                    <select
                      id={`${editorId}-frequency`}
                      value={draft.frequency}
                      onChange={(event) =>
                        onDraftChange(suggestion.id, {
                          frequency: event.target
                            .value as HabitDraft['frequency'],
                        })
                      }
                      className={cn(
                        'h-10 w-full rounded-2xl border border-border bg-card px-3 text-sm transition-colors',
                        'focus-visible:border-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
                      )}
                    >
                      {FREQUENCY_OPTIONS.map((frequency) => (
                        <option key={frequency} value={frequency}>
                          {FREQUENCY_LABELS[frequency]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
