'use client'

import { Check, PencilLine } from 'lucide-react'
import { IDENTITY_OPTIONS } from '@/lib/constants'
import { cn, getAccentColors } from '@/lib/utils'

interface StepIdentityProps {
  selectedSlugs: string[]
  onToggle: (slug: string) => void
  onChooseMyOwn: () => void
}

const cardBase =
  'relative flex flex-col items-start gap-1.5 rounded-3xl border p-4 text-left transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function StepIdentity({ selectedSlugs, onToggle, onChooseMyOwn }: StepIdentityProps) {
  const showGentleNudge = selectedSlugs.length > 3

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">Choose a direction</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Start small. You can add more later.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {IDENTITY_OPTIONS.map((option) => {
          const isSelected = selectedSlugs.includes(option.slug)
          const accent = getAccentColors(option.accent)

          return (
            <button
              key={option.slug}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(option.slug)}
              className={cn(
                cardBase,
                isSelected
                  ? cn(accent.border, accent.soft)
                  : 'border-border bg-card hover:bg-secondary/60'
              )}
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                {option.icon}
              </span>
              <span className="pr-6 text-sm font-medium">{option.name}</span>
              <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {option.description}
              </span>
              {isSelected && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-white',
                    accent.bg
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onChooseMyOwn}
          className={cn(
            cardBase,
            'border-dashed border-border bg-card hover:bg-secondary/60'
          )}
        >
          <PencilLine aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">My own</span>
          <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            Describe it in your own words instead.
          </span>
        </button>
      </div>

      <div aria-live="polite" className="min-h-5">
        {showGentleNudge && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Three is a good place to start.
          </p>
        )}
      </div>
    </div>
  )
}
