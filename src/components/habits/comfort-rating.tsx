'use client'

import { cn } from '@/lib/utils'
import type { ComfortRating as ComfortRatingValue } from '@/types'

interface ComfortOption {
  value: ComfortRatingValue
  label: string
  hint: string
}

const BASE_OPTIONS: ReadonlyArray<ComfortOption> = [
  { value: 'easy', label: 'Easy', hint: 'That felt easy' },
  { value: 'right', label: 'Right', hint: 'That felt about right' },
  { value: 'stretch', label: 'Stretch', hint: 'That felt like a stretch' },
]

const TOO_MUCH_OPTION: ComfortOption = {
  value: 'too_much',
  label: 'Too much',
  hint: 'That felt like too much',
}

interface ComfortRatingProps {
  value?: ComfortRatingValue
  onChange: (value: ComfortRatingValue) => void
  /** Adds the optional "Too much" pill. */
  showTooMuch?: boolean
  size?: 'sm' | 'lg'
  label?: string
  className?: string
}

export function ComfortRating({
  value,
  onChange,
  showTooMuch = false,
  size = 'sm',
  label = 'How did that feel?',
  className,
}: ComfortRatingProps) {
  const options = showTooMuch ? [...BASE_OPTIONS, TOO_MUCH_OPTION] : BASE_OPTIONS

  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map(option => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-label={option.hint}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border font-medium transition-all select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
              'active:scale-[0.98]',
              size === 'sm' ? 'h-8 px-3.5 text-xs' : 'h-12 px-7 text-sm',
              selected
                ? 'border-transparent bg-violet-600 text-white shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-violet-300 hover:text-foreground dark:hover:border-violet-700'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
