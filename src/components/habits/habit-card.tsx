'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Minus, MoreHorizontal, Play, Plus, SkipForward, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatDuration, getAccentColors } from '@/lib/utils'
import type { Habit, HabitCheckin, HabitSchedule, Identity } from '@/types'

/** ISO weekday labels — 1 = Monday … 7 = Sunday, matching Habit.schedule.daysOfWeek. */
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export function formatHabitValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function unitSuffix(habit: Habit): string {
  return habit.unit ? ` ${habit.unit}` : ''
}

export function scheduleLabel(schedule: HabitSchedule): string {
  switch (schedule.frequency) {
    case 'daily':
      return 'Daily'
    case 'weekdays':
      return 'Weekdays'
    case 'weekends':
      return 'Weekends'
    case 'custom': {
      const days = schedule.daysOfWeek
      if (!days || days.length === 0) return 'Custom days'
      return [...days]
        .sort((a, b) => a - b)
        .map(day => DAY_LABELS[day - 1])
        .filter((label): label is (typeof DAY_LABELS)[number] => Boolean(label))
        .join(', ')
    }
  }
}

export function targetLabel(habit: Habit): string {
  switch (habit.type) {
    case 'duration':
      return formatDuration(habit.currentTarget)
    case 'quantity':
      return `${formatHabitValue(habit.currentTarget)}${unitSuffix(habit)}`
    case 'count':
      return `${formatHabitValue(habit.currentTarget)}×`
    case 'reduction':
      return `${formatHabitValue(habit.currentTarget)}${unitSuffix(habit)} or fewer`
    case 'binary':
      return 'Once'
  }
}

/** A habit counts as done when its check-in actually meets the day's target. */
export function isHabitComplete(habit: Habit, checkin?: HabitCheckin): boolean {
  if (!checkin) return false
  if (habit.type === 'quantity' || habit.type === 'count') {
    return checkin.actualValue !== undefined
      ? checkin.actualValue >= habit.currentTarget
      : checkin.status === 'complete'
  }
  if (habit.type === 'reduction') {
    return checkin.status === 'complete' && (checkin.actualValue ?? 0) <= habit.currentTarget
  }
  return checkin.status === 'complete'
}

interface HabitCardProps {
  habit: Habit
  identity: Identity
  checkin?: HabitCheckin
  onComplete: (habit: Habit) => void
  onSkip: (habit: Habit) => void
  onStartTimer: (habit: Habit) => void
  onIncrement: (habit: Habit, delta: number) => void
  onMakeEasier?: (habit: Habit) => void
  className?: string
}

export function HabitCard({
  habit,
  identity,
  checkin,
  onComplete,
  onSkip,
  onStartTimer,
  onIncrement,
  onMakeEasier,
  className,
}: HabitCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const accent = getAccentColors(identity.accent)
  const done = isHabitComplete(habit, checkin)
  const skipped = !done && checkin?.status === 'skipped'
  const value = checkin?.actualValue ?? 0

  const isStepper = habit.type === 'quantity' || habit.type === 'count'
  const isReduction = habit.type === 'reduction'
  const isTimed = habit.type === 'duration'
  const showCheckButton = habit.type === 'binary' || isTimed

  const step = habit.type === 'quantity' && habit.currentTarget <= 4 ? 0.2 : 1
  const overGoal = isReduction && value > habit.currentTarget
  const menuId = `habit-options-${habit.id}`

  return (
    <article
      aria-label={`${habit.name}, part of ${identity.name}`}
      className={cn(
        'rounded-3xl border p-5 transition-colors duration-300',
        done ? cn(accent.soft, accent.border) : 'border-border bg-card',
        skipped && 'opacity-75',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', accent.bg)} aria-hidden="true" />
            <h3 className={cn('text-base font-medium leading-tight', done && 'text-muted-foreground')}>
              {habit.name}
            </h3>
            <span className="rounded-full bg-secondary/70 px-2 py-0.5 text-xs text-muted-foreground">
              {identity.name}
            </span>
          </div>

          {isReduction ? (
            <>
              <p className="mt-1.5 text-sm text-muted-foreground">{scheduleLabel(habit.schedule)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Goal: {formatHabitValue(habit.currentTarget)}
                {unitSuffix(habit)} or fewer today
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {targetLabel(habit)} · {scheduleLabel(habit.schedule)}
            </p>
          )}

          {done && (
            <p className={cn('mt-1.5 text-xs font-medium', accent.text)}>
              {isReduction ? 'Under your goal today' : 'Done for today'}
            </p>
          )}
          {skipped && (
            <p className="mt-1.5 text-xs text-muted-foreground">Skipped for today. Tomorrow is open.</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isTimed && !done && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartTimer(habit)}
              aria-label={`Start a ${formatDuration(habit.currentTarget)} timer for ${habit.name}`}
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Start
            </Button>
          )}

          {showCheckButton && (
            <motion.button
              type="button"
              onClick={() => onComplete(habit)}
              aria-pressed={done}
              aria-label={done ? `${habit.name} is done. Undo.` : `Mark ${habit.name} complete`}
              // `initial={false}` keeps already-complete cards from pulsing on page load.
              initial={false}
              animate={done ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.34, times: [0, 0.5, 1], ease: 'easeOut' }}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                done
                  ? cn(accent.bg, 'border-transparent')
                  : 'border-border bg-transparent hover:border-foreground/30'
              )}
            >
              <AnimatePresence initial={false}>
                {done && (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex"
                  >
                    <Check className="h-5 w-5 text-white" strokeWidth={3} aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {isStepper && (
            <div className="flex items-center gap-0.5 rounded-full border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => onIncrement(habit, -step)}
                disabled={value <= 0}
                aria-label={`Remove ${formatHabitValue(step)}${unitSuffix(habit)} from ${habit.name}`}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors',
                  'hover:bg-secondary hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                  'disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground'
                )}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span
                aria-live="polite"
                className={cn(
                  'min-w-[72px] px-1 text-center text-sm font-medium tabular-nums',
                  done ? accent.text : 'text-foreground'
                )}
              >
                {formatHabitValue(value)} / {formatHabitValue(habit.currentTarget)}
                {unitSuffix(habit)}
              </span>
              <button
                type="button"
                onClick={() => onIncrement(habit, step)}
                aria-label={`Add ${formatHabitValue(step)}${unitSuffix(habit)} to ${habit.name}`}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors',
                  'hover:bg-secondary hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
                )}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {isReduction && (
            <div
              className={cn(
                'flex items-center gap-1 rounded-full border p-1',
                overGoal
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-800/70 dark:bg-amber-950/30'
                  : 'border-border bg-background'
              )}
            >
              <span
                aria-live="polite"
                className={cn(
                  'px-2 text-sm font-medium tabular-nums',
                  overGoal ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
                )}
              >
                {formatHabitValue(value)}
                {unitSuffix(habit)}
              </span>
              <button
                type="button"
                onClick={() => onIncrement(habit, 1)}
                aria-label={`Log one more toward ${habit.name}. Currently ${formatHabitValue(value)}${unitSuffix(habit)} of ${formatHabitValue(habit.currentTarget)} or fewer.`}
                className={cn(
                  'h-8 rounded-full px-3 text-xs font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                  overGoal
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                )}
              >
                +1
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
            aria-label={`More options for ${habit.name}`}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors',
              'hover:bg-secondary hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
              menuOpen && 'bg-secondary text-foreground'
            )}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            id={menuId}
            key="options"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              role="group"
              aria-label={`Options for ${habit.name}`}
              className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMenuOpen(false)
                  onSkip(habit)
                }}
              >
                <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                Skip for today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMenuOpen(false)
                  onMakeEasier?.(habit)
                }}
              >
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                Make it easier
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
