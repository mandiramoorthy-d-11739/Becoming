'use client'

import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Habit } from '@/types'

export type ProgressionFeeling = 'too_much' | 'about_right' | 'surprisingly_easy'
export type ProgressionMode = 'propose' | 'feedback'

/* -------------------------------------------------------------------------- */
/* Target helpers                                                              */
/* -------------------------------------------------------------------------- */

function round(value: number): number {
  return Math.round(value * 10) / 10
}

/** A step that is small enough to feel almost easy. */
export function suggestNextTarget(habit: Habit): number {
  const floor = habit.type === 'quantity' ? 0.5 : 1
  const step = Math.max(floor, round(habit.currentTarget * 0.25))
  if (habit.type === 'reduction') return Math.max(floor, round(habit.currentTarget - step))
  return round(habit.currentTarget + step)
}

/** "3 minutes" — used in sentences. */
export function formatTargetLong(habit: Habit, value: number): string {
  if (habit.type === 'binary') return value === 1 ? 'once' : `${value} times`
  if (!habit.unit) return `${value}`
  if (habit.unit === 'minutes') return `${value} minute${value === 1 ? '' : 's'}`
  return `${value} ${habit.unit}`
}

/** "3 min" — used on buttons and pills. */
export function formatTargetShort(habit: Habit, value: number): string {
  if (habit.type === 'binary') return `${value}×`
  if (!habit.unit) return `${value}`
  if (habit.unit === 'minutes') return `${value} min`
  return `${value} ${habit.unit}`
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                     */
/* -------------------------------------------------------------------------- */

interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  format: (value: number) => string
}

function Stepper({ label, value, onChange, min, max, step, format }: StepperProps) {
  const labelId = useId()

  return (
    <div className="space-y-1.5">
      <span id={labelId} className="block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Decrease ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(round(Math.max(min, value - step)))}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </Button>

        <output
          aria-labelledby={labelId}
          className="flex-1 text-center text-sm font-medium tabular-nums"
        >
          {format(value)}
        </output>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Increase ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(round(Math.min(max, value + step)))}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Feedback copy                                                               */
/* -------------------------------------------------------------------------- */

const FEELING_OPTIONS: ReadonlyArray<{ value: ProgressionFeeling; label: string; hint: string }> = [
  { value: 'too_much', label: 'Too much', hint: 'It asked more than I had.' },
  { value: 'about_right', label: 'About right', hint: 'It fit into the day.' },
  { value: 'surprisingly_easy', label: 'Surprisingly easy', hint: 'I barely noticed it.' },
]

const FEELING_FOLLOW_UP: Record<ProgressionFeeling, string> = {
  too_much: "Coming back down is a real answer, not a step backwards. Nothing you built is lost.",
  about_right: 'Sounds like it fits. Keeping it is the simplest next step.',
  surprisingly_easy:
    'Good to know. You can keep this, or stay here a while longer before going further.',
}

interface FollowUpOption {
  value: number
  label: string
  recommended: boolean
}

/** Keeps the first option for each target, so a midpoint never repeats a choice. */
function dedupeByValue(options: FollowUpOption[]): FollowUpOption[] {
  const seen = new Set<number>()
  return options.filter(option => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
}

/* -------------------------------------------------------------------------- */
/* Sheet                                                                       */
/* -------------------------------------------------------------------------- */

interface ProgressionSheetProps {
  habit: Habit
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called when the user chooses to run an experiment at `target` for `days`. */
  onAccept: (target: number, days: number) => void
  onDecline: () => void
  mode?: ProgressionMode
  /** In feedback mode: the target the last experiment ran at. */
  experimentTarget?: number
  /** In feedback mode: the target to come back to if it didn't fit. */
  previousTarget?: number
  /**
   * In feedback mode: called with how it felt and the target the user picked.
   * If it isn't provided, `onAccept` is used instead.
   */
  onFeedback?: (feeling: ProgressionFeeling, chosenTarget: number) => void
  suggestedTarget?: number
  suggestedDays?: number
  /** The observation behind the suggestion, in the companion's voice. */
  evidence?: string
}

export function ProgressionSheet({ open, onOpenChange, ...body }: ProgressionSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        {/* Unmounted with the dialog, so every opening starts from the suggestion again. */}
        <ProgressionBody key={body.mode ?? 'propose'} {...body} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}

type ProgressionBodyProps = Omit<ProgressionSheetProps, 'open'>

function ProgressionBody({
  habit,
  onOpenChange,
  onAccept,
  onDecline,
  mode = 'propose',
  experimentTarget,
  previousTarget,
  onFeedback,
  suggestedTarget,
  suggestedDays = 4,
  evidence,
}: ProgressionBodyProps) {
  const { reducedMotion } = useAppStore()

  const isReduction = habit.type === 'reduction'
  const stepSize = habit.type === 'quantity' ? 0.5 : 1

  const [target, setTarget] = useState(suggestedTarget ?? suggestNextTarget(habit))
  const [days, setDays] = useState(suggestedDays)
  const [adjusting, setAdjusting] = useState(false)
  const [feeling, setFeeling] = useState<ProgressionFeeling | null>(null)

  const tried = experimentTarget ?? habit.currentTarget
  const previous =
    previousTarget ??
    (isReduction ? round(tried + stepSize) : Math.max(stepSize, round(tried - stepSize)))
  const middle = round((tried + previous) / 2)

  const handleAccept = () => {
    onAccept(target, days)
    onOpenChange(false)
  }

  const handleDecline = () => {
    onDecline()
    onOpenChange(false)
  }

  const handleChoose = (chosen: number) => {
    if (!feeling) return
    if (onFeedback) onFeedback(feeling, chosen)
    else onAccept(chosen, days)
    onOpenChange(false)
  }

  const defaultEvidence = `You've kept ${habit.name.toLowerCase()} at ${formatTargetLong(
    habit,
    habit.currentTarget
  )} on most days lately, and it's usually felt comfortable.`

  const followUps: ReadonlyArray<FollowUpOption> =
    feeling === null
      ? []
      : dedupeByValue([
          {
            value: tried,
            label: `Keep ${formatTargetShort(habit, tried)}`,
            recommended: feeling !== 'too_much',
          },
          {
            value: previous,
            label: `Return to ${formatTargetShort(habit, previous)}`,
            recommended: feeling === 'too_much',
          },
          {
            value: middle,
            label: `Try ${formatTargetShort(habit, middle)}`,
            recommended: false,
          },
        ])

  return (
    <>
      {mode === 'propose' ? (
        <>
          <DialogHeader>
            <DialogTitle className="text-balance">
              {isReduction ? 'Want to bring this down a little?' : 'Want to try a little more?'}
            </DialogTitle>
            <DialogDescription>{evidence ?? defaultEvidence}</DialogDescription>
          </DialogHeader>

          <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/30">
            <p className="text-[10px] font-medium uppercase tracking-wide text-violet-700/80 dark:text-violet-400/80">
              A small experiment
            </p>
            <p className="mt-2 text-2xl font-semibold leading-tight text-violet-900 dark:text-violet-100 text-balance">
              Try {formatTargetLong(habit, target)} for {days} {days === 1 ? 'day' : 'days'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-violet-800/80 dark:text-violet-300/80">
              Then we&rsquo;ll ask how it felt. Nothing sticks until you say it should.
            </p>
          </div>

          <AnimatePresence initial={false}>
            {adjusting && (
              <motion.div
                key="adjust"
                initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Stepper
                    label="Target"
                    value={target}
                    onChange={setTarget}
                    min={stepSize}
                    max={Math.max(habit.currentTarget * 4, habit.currentTarget + 10)}
                    step={stepSize}
                    format={value => formatTargetShort(habit, value)}
                  />
                  <Stepper
                    label="For how many days"
                    value={days}
                    onChange={setDays}
                    min={1}
                    max={30}
                    step={1}
                    format={value => `${value} ${value === 1 ? 'day' : 'days'}`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 space-y-3">
            <Button variant="primary" size="lg" className="w-full" onClick={handleAccept}>
              Try it
            </Button>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={handleDecline}>
                Not now
              </Button>
              <Button
                variant="link"
                size="sm"
                aria-expanded={adjusting}
                onClick={() => setAdjusting(value => !value)}
              >
                {adjusting ? 'Use the suggestion' : 'Adjust suggestion'}
              </Button>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              If it doesn&rsquo;t feel right, we&rsquo;ll bring it back.
            </p>
          </div>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle className="text-balance">How did the last few days feel?</DialogTitle>
            <DialogDescription>
              You&rsquo;ve been at {formatTargetLong(habit, tried)}. However it went is useful —
              there&rsquo;s no right answer here.
            </DialogDescription>
          </DialogHeader>

          <div role="group" aria-label="How did the last few days feel?" className="space-y-2.5">
            {FEELING_OPTIONS.map(option => {
              const selected = feeling === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFeeling(option.value)}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                    selected
                      ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30'
                      : 'border-border hover:bg-secondary'
                  )}
                >
                  <span className="block text-base font-medium">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence initial={false}>
            {feeling && (
              <motion.div
                key="follow-up"
                initial={reducedMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                className="mt-6 space-y-3"
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {FEELING_FOLLOW_UP[feeling]}
                </p>

                <div className="space-y-2">
                  {followUps.map(option => (
                    <Button
                      key={option.label}
                      variant={option.recommended ? 'primary' : 'outline'}
                      className="w-full"
                      onClick={() => handleChoose(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Nothing changes until you choose. You can sit with it and come back.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  )
}
