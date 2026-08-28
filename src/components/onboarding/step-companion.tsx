'use client'

import { CompanionOrb } from '@/components/companion/companion-orb'
import { COMPANION_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CompanionStyle } from '@/types'

interface StepCompanionProps {
  value: CompanionStyle
  onChange: (style: CompanionStyle) => void
  reduceMotion: boolean
}

const STYLE_ORDER: CompanionStyle[] = [
  'warm_friend',
  'calm_coach',
  'gentle_guide',
  'direct_motivator',
]

export function StepCompanion({ value, onChange, reduceMotion }: StepCompanionProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 id="companion-style-heading" className="text-2xl font-semibold tracking-tight text-balance">
          How should Becoming support you?
        </h2>
      </header>

      <div role="radiogroup" aria-labelledby="companion-style-heading" className="space-y-3">
        {STYLE_ORDER.map((style) => {
          const option = COMPANION_STYLES[style]
          const isSelected = value === style

          return (
            <label key={style} className="block cursor-pointer">
              <input
                type="radio"
                name="companion-style"
                value={style}
                checked={isSelected}
                onChange={() => onChange(style)}
                className="peer sr-only"
              />
              <div
                className={cn(
                  'rounded-3xl border p-5 transition-colors',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                  isSelected
                    ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30'
                    : 'border-border bg-card hover:bg-secondary/50'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      isSelected ? 'border-violet-600' : 'border-border'
                    )}
                  >
                    {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />}
                  </span>

                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {option.description}
                    </p>
                    <div className="flex items-center gap-2.5 pt-1">
                      <CompanionOrb
                        style={style}
                        size="sm"
                        animate={isSelected && !reduceMotion}
                        className="shrink-0"
                      />
                      <p className="text-sm italic leading-relaxed text-muted-foreground">
                        &ldquo;{option.preview[0]}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          )
        })}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        You can change this whenever you want.
      </p>
    </div>
  )
}
