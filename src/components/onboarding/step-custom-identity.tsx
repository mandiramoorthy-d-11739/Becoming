'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, getAccentColors } from '@/lib/utils'
import { formatTargetLine, PREVIEWED_STARTS, type CustomIdentityDraft } from './suggestions'

export type CustomIdentityPhase = 'idle' | 'reading' | 'result'

interface StepCustomIdentityProps {
  text: string
  onTextChange: (text: string) => void
  phase: CustomIdentityPhase
  draft: CustomIdentityDraft | null
  reduceMotion: boolean
}

const PLACEHOLDER_EXAMPLES = [
  'I want to become someone who takes care of my body.',
  'I want to become someone who stays calm when things get loud.',
  'I want to become someone who finishes what they start.',
]

const EXAMPLE_CHIPS = [
  'Take care of my body',
  'Be calmer under pressure',
  'Stop losing evenings to my phone',
]

const PLACEHOLDER_INTERVAL_MS = 3600

export function StepCustomIdentity({
  text,
  onTextChange,
  phase,
  draft,
  reduceMotion,
}: StepCustomIdentityProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const shouldCycle = reduceMotion === false && text.length === 0

  useEffect(() => {
    if (!shouldCycle) return
    const interval = window.setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % PLACEHOLDER_EXAMPLES.length)
    }, PLACEHOLDER_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [shouldCycle])

  const accent = getAccentColors(draft?.accent ?? 'violet')

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          Describe the person you want to become.
        </h2>
      </header>

      <div className="space-y-3">
        <label htmlFor="custom-identity" className="sr-only">
          Describe the person you want to become.
        </label>
        <Textarea
          id="custom-identity"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          rows={4}
          aria-describedby="custom-identity-examples"
        />

        <div className="space-y-2">
          <p id="custom-identity-examples" className="text-xs text-muted-foreground">
            Or start from one of these:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onTextChange(chip)}
                className={cn(
                  'rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors',
                  'hover:bg-secondary hover:text-foreground active:scale-[0.98]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div aria-live="polite" aria-busy={phase === 'reading'}>
        {phase === 'reading' && (
          <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
            <span className="sr-only">Reading what you wrote.</span>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
            <div className="space-y-2.5">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        )}

        {phase === 'result' && draft && (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={cn('space-y-4 rounded-3xl border p-5', accent.border, accent.soft)}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-2xl leading-none">
                {draft.icon}
              </span>
              <div>
                <p className={cn('text-lg font-semibold tracking-tight', accent.text)}>
                  {draft.name}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">{draft.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Suggested small starts</p>
              <ul className="space-y-2">
                {draft.starts.slice(0, PREVIEWED_STARTS).map((start) => (
                  <li
                    key={start.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white',
                        accent.bg
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{start.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatTargetLine(start.target, start.unit, start.frequency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
