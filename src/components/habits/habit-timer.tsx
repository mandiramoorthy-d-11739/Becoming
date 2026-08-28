'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ComfortRating } from '@/components/habits/comfort-rating'
import { cn, formatDuration } from '@/lib/utils'
import type { ComfortRating as ComfortRatingValue, Habit } from '@/types'

const RING_SIZE = 240
const RING_STROKE = 8
const ANNOUNCE_EVERY_SECONDS = 30

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function spokenTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  const parts: string[] = []
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  if (seconds > 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(' ') : 'no time'
}

interface HabitTimerProps {
  habit: Habit
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (comfortRating: ComfortRatingValue) => void
}

export function HabitTimer({ habit, open, onOpenChange, onComplete }: HabitTimerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          'left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0',
          'rounded-none border-0 bg-background p-6 shadow-none sm:p-10',
          'flex flex-col items-center justify-center gap-10'
        )}
      >
        <DialogTitle className="text-base font-medium tracking-tight text-muted-foreground">
          {habit.name}
        </DialogTitle>

        {/* Remounted on every open, so each session starts clean. */}
        <TimerSession
          key={habit.id}
          habit={habit}
          onComplete={onComplete}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface TimerSessionProps {
  habit: Habit
  onComplete: (comfortRating: ComfortRatingValue) => void
  onClose: () => void
}

function TimerSession({ habit, onComplete, onClose }: TimerSessionProps) {
  const totalSeconds = Math.max(1, Math.round(habit.currentTarget * 60))

  const [remaining, setRemaining] = useState(totalSeconds)
  const [running, setRunning] = useState(false)
  const [finishedEarly, setFinishedEarly] = useState(false)
  const [rating, setRating] = useState<ComfortRatingValue | undefined>(undefined)

  const phase: 'timer' | 'rating' = finishedEarly || remaining <= 0 ? 'rating' : 'timer'
  const countingDown = running && remaining > 0

  useEffect(() => {
    if (!countingDown) return
    const interval = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [countingDown])

  const handleFinishEarly = useCallback(() => {
    setRunning(false)
    setFinishedEarly(true)
  }, [])

  const handleRate = useCallback(
    (value: ComfortRatingValue) => {
      setRating(value)
      onComplete(value)
      onClose()
    },
    [onComplete, onClose]
  )

  const radius = (RING_SIZE - RING_STROKE * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(remaining / totalSeconds, 0), 1)
  const center = RING_SIZE / 2
  const notStarted = remaining === totalSeconds && !running

  // Derived so the live region only speaks on the half-minute and at the finish.
  const announcement =
    phase === 'rating'
      ? `${habit.name} finished. How did that feel?`
      : running && remaining % ANNOUNCE_EVERY_SECONDS === 0
        ? `${spokenTime(remaining)} remaining.`
        : ''

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {phase === 'timer' ? (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="flex w-full max-w-sm flex-col items-center gap-10"
          >
            <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
              <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                className="-rotate-90"
                aria-hidden="true"
                focusable="false"
              >
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={RING_STROKE}
                  className="text-violet-100 dark:text-violet-950/60"
                />
                <motion.circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  className="text-violet-500 dark:text-violet-400"
                  animate={{ strokeDashoffset: circumference * (1 - progress) }}
                  transition={{ duration: running ? 1 : 0.35, ease: 'linear' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-5xl font-light tabular-nums tracking-tight">
                  {formatClock(remaining)}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {running ? 'remaining' : notStarted ? formatDuration(habit.currentTarget) : 'paused'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className="min-w-[168px]"
                onClick={() => setRunning(value => !value)}
                aria-label={running ? 'Pause the timer' : notStarted ? 'Start the timer' : 'Resume the timer'}
              >
                {running ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    {notStarted ? 'Start' : 'Resume'}
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleFinishEarly}>
                Finish early
              </Button>
            </div>

            <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
              However long you stay is enough. You can stop whenever you need to.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="rating"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="flex w-full max-w-sm flex-col items-center gap-8"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">How did that feel?</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                There&rsquo;s no wrong answer. This is how your next step learns to fit you.
              </p>
            </div>

            <ComfortRating
              size="lg"
              value={rating}
              onChange={handleRate}
              label="How did that feel?"
              className="justify-center"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
