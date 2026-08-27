'use client'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Check } from 'lucide-react'
import { COMPANION_STYLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { CompanionStyle } from '@/types'

interface CompanionStylePickerProps {
  value: CompanionStyle
  onChange: (style: CompanionStyle) => void
}

const STYLE_ORDER: readonly CompanionStyle[] = [
  'warm_friend',
  'calm_coach',
  'gentle_guide',
  'direct_motivator',
]

export function CompanionStylePicker({ value, onChange }: CompanionStylePickerProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(next) => onChange(next as CompanionStyle)}
      aria-label="Companion style"
      className="space-y-3"
    >
      {STYLE_ORDER.map((style) => {
        const { label, description, preview } = COMPANION_STYLES[style]
        const isSelected = style === value

        return (
          <RadioGroupPrimitive.Item
            key={style}
            value={style}
            aria-label={label}
            className={cn(
              'w-full rounded-2xl border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
              isSelected
                ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30'
                : 'border-border hover:bg-secondary'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium leading-snug">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
                <p className="text-xs italic leading-relaxed text-muted-foreground">
                  &ldquo;{preview[0]}&rdquo;
                </p>
              </div>

              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-border bg-transparent'
                )}
              >
                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            </div>
          </RadioGroupPrimitive.Item>
        )
      })}
    </RadioGroupPrimitive.Root>
  )
}
