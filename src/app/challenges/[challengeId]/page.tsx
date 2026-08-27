'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/app-shell'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { formatTargetLong, formatTargetShort, suggestNextTarget } from '@/components/habits/progression-sheet'
import { getHabit, updateHabit } from '@/lib/api/habits'
import { mockFetch } from '@/lib/api/mock-client'
// No challenges endpoint exists yet — the seed is the app's mock source of truth.
import { MOCK_CHALLENGES } from '@/data/seed'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { ComfortRating, Habit, PersonalChallenge } from '@/types'

type Phase = 'invitation' | 'active' | 'result'

const FEELING_CHIPS: ReadonlyArray<{ value: ComfortRating; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'right', label: 'Right' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'too_much', label: 'Hard' },
]

/** "2-minute" — reads naturally in front of a noun. */
function habitPhrase(habit: Habit, value: number): string {
  if (habit.unit === 'minutes') return `${value}-minute`
  if (habit.unit) return `${value} ${habit.unit}`
  return `${value}`
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes === 0) return `${rest} second${rest === 1 ? '' : 's'}`
  return `${minutes}m ${String(rest).padStart(2, '0')}s`
}

function spokenElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  const parts: string[] = []
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  if (rest > 0) parts.push(`${rest} second${rest === 1 ? '' : 's'}`)
  return parts.length > 0 ? parts.join(' ') : 'a moment'
}

async function getChallenge(id: string): Promise<PersonalChallenge | undefined> {
  return mockFetch(
    MOCK_CHALLENGES.find(challenge => challenge.id === id),
    400
  )
}

function chipClasses(selected: boolean): string {
  return cn(
    'h-12 rounded-full border px-6 text-sm font-medium transition-all select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
    'active:scale-[0.98]',
    selected
      ? 'border-transparent bg-violet-600 text-white shadow-sm'
      : 'border-border bg-card text-muted-foreground hover:border-violet-300 hover:text-foreground dark:hover:border-violet-700'
  )
}

export default function ChallengePage() {
  const params = useParams<{ challengeId: string }>()
  const challengeId = params.challengeId
  const router = useRouter()
  const queryClient = useQueryClient()
  const { reducedMotion } = useAppStore()

  const challengeQuery = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => getChallenge(challengeId),
  })
  const challenge = challengeQuery.data

  const habitQuery = useQuery({
    queryKey: ['habit', challenge?.habitId],
    queryFn: () => getHabit(challenge?.habitId ?? ''),
    enabled: Boolean(challenge?.habitId),
  })
  const habit = habitQuery.data

  const [phase, setPhase] = useState<Phase>('invitation')
  const [elapsed, setElapsed] = useState(0)
  const [showTimer, setShowTimer] = useState(false)
  const [feeling, setFeeling] = useState<ComfortRating | null>(null)
  const [reflection, setReflection] = useState('')
  const [decision, setDecision] = useState('')
  const startedAtRef = useRef(0)

  useEffect(() => {
    if (phase !== 'active') return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const handleStart = useCallback(() => {
    startedAtRef.current = Date.now()
    setElapsed(0)
    setShowTimer(false)
    setPhase('active')
  }, [])

  const targetMutation = useMutation({
    mutationFn: (currentTarget: number) => updateHabit(habit?.id ?? '', { currentTarget }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] })
      if (habit) void queryClient.invalidateQueries({ queryKey: ['habit', habit.id] })
    },
  })

  /* ---- Loading / missing ------------------------------------------------ */

  if (challengeQuery.isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl space-y-6 px-5 pt-16">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-12 w-44 rounded-2xl" />
        </div>
      </AppShell>
    )
  }

  if (challengeQuery.isError) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-5 pt-16">
          <ErrorState
            message="This challenge didn't load."
            onRetry={() => void challengeQuery.refetch()}
          />
        </div>
      </AppShell>
    )
  }

  if (!challenge) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl space-y-6 px-5 pt-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            This challenge isn&rsquo;t here anymore.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Invitations come and go. There will be another one when the moment fits.
          </p>
          <Button asChild variant="soft">
            <Link href="/today">Back to today</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  const keepTarget = habit?.currentTarget ?? 0
  const stretchTarget = habit ? suggestNextTarget(habit) : 0

  /* ---- Invitation ------------------------------------------------------- */

  if (phase === 'invitation') {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[80dvh] max-w-xl flex-col justify-center gap-8 px-5 py-16">
          <div
            aria-hidden="true"
            className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-amber-200/70 to-violet-200/50 blur-2xl dark:from-amber-900/40 dark:to-violet-900/30"
          />

          <div className="space-y-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700/90 dark:text-amber-500/90">
              A personal challenge
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{challenge.title}</h1>
            <p className="text-base leading-relaxed text-muted-foreground text-balance">
              {challenge.description}
            </p>
          </div>

          <div className="space-y-3">
            <Button variant="primary" size="lg" className="w-full" onClick={handleStart}>
              Try the challenge
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.back()}>
              Maybe another day
            </Button>
            <p className="text-xs leading-relaxed text-muted-foreground">
              There&rsquo;s no scoring here. You can stop the moment you want to.
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  /* ---- Active ----------------------------------------------------------- */

  if (phase === 'active') {
    return (
      <AppShell showNav={false}>
        <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-10 px-5 py-16 text-center">
          <h1 className="sr-only">{challenge.title}</h1>

          {reducedMotion ? (
            <div
              aria-hidden="true"
              className="h-48 w-48 rounded-full bg-gradient-to-br from-violet-300 via-violet-200 to-amber-100 opacity-80 blur-md dark:from-violet-800 dark:via-violet-900 dark:to-amber-950"
            />
          ) : (
            <motion.div
              aria-hidden="true"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="h-48 w-48 rounded-full bg-gradient-to-br from-violet-300 via-violet-200 to-amber-100 opacity-80 blur-md dark:from-violet-800 dark:via-violet-900 dark:to-amber-950"
            />
          )}

          <p className="text-sm text-muted-foreground">End whenever you want.</p>

          {showTimer && (
            <p className="text-2xl font-light tabular-nums tracking-tight" aria-live="off">
              {formatElapsed(elapsed)}
            </p>
          )}

          <div className="flex flex-col items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="min-w-[168px]"
              onClick={() => setPhase('result')}
            >
              I&rsquo;m done
            </Button>

            <Button
              variant="link"
              size="sm"
              aria-expanded={showTimer}
              className="text-muted-foreground"
              onClick={() => setShowTimer(value => !value)}
            >
              {showTimer ? 'Hide timer' : 'Show timer'}
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  /* ---- Result ----------------------------------------------------------- */

  const elapsedLabel = elapsed < 5 ? 'a moment' : formatElapsed(elapsed)

  return (
    <AppShell>
      <div className="relative mx-auto max-w-xl space-y-8 px-5 py-16">
        <motion.div
          aria-hidden="true"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="pointer-events-none absolute -top-4 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-700/20"
        />

        <header className="relative space-y-3">
          <h1
            className="text-3xl font-semibold tracking-tight text-balance"
            aria-label={`You stayed with it for ${spokenElapsed(elapsed)}.`}
          >
            You stayed with it for {elapsedLabel}.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            However long that was, you found out something you didn&rsquo;t know this morning.
          </p>
        </header>

        <section aria-labelledby="feeling-heading" className="space-y-4">
          <h2 id="feeling-heading" className="text-lg font-medium tracking-tight">
            How did that feel?
          </h2>
          <div role="group" aria-labelledby="feeling-heading" className="flex flex-wrap gap-2">
            {FEELING_CHIPS.map(chip => (
              <button
                key={chip.value}
                type="button"
                aria-pressed={feeling === chip.value}
                onClick={() => setFeeling(chip.value)}
                className={chipClasses(feeling === chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="challenge-reflection" className="block text-xs font-medium text-muted-foreground">
              Anything you want to remember about it? (optional)
            </label>
            <Textarea
              id="challenge-reflection"
              value={reflection}
              onChange={event => setReflection(event.target.value)}
              placeholder="It felt different without watching the clock…"
            />
          </div>
        </section>

        {habitQuery.isPending ? (
          <Skeleton className="h-40 w-full rounded-3xl" />
        ) : habit ? (
          <section
            aria-labelledby="next-heading"
            aria-live="polite"
            className="rounded-3xl border border-border bg-card p-5"
          >
            {decision ? (
              <>
                <h2 id="next-heading" className="text-lg font-medium tracking-tight text-balance">
                  {decision}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  You can change it again from the habit itself, any time.
                </p>
              </>
            ) : (
              <>
                <h2 id="next-heading" className="text-lg font-medium tracking-tight text-balance">
                  Want to keep your normal {habitPhrase(habit, keepTarget)} habit, or experiment
                  with {stretchTarget}?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  One good day doesn&rsquo;t have to become a new rule. Only change it if you want
                  to.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={targetMutation.isPending}
                    onClick={() =>
                      setDecision(
                        `Keeping ${formatTargetLong(habit, keepTarget)}. That's a solid place to be.`
                      )
                    }
                  >
                    Keep {formatTargetShort(habit, keepTarget)}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={targetMutation.isPending}
                    onClick={() => {
                      targetMutation.mutate(stretchTarget)
                      setDecision(
                        `We'll try ${formatTargetLong(
                          habit,
                          stretchTarget
                        )} for a few days and see how it sits.`
                      )
                    }}
                  >
                    Try {formatTargetShort(habit, stretchTarget)}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={targetMutation.isPending}
                    onClick={() =>
                      setDecision("Nothing to decide today. It'll still be here tomorrow.")
                    }
                  >
                    Decide later
                  </Button>
                </div>
              </>
            )}

            {targetMutation.isError && (
              <p role="alert" className="mt-2 text-sm text-muted-foreground">
                That didn&rsquo;t save. Your habit is unchanged — you can try again.
              </p>
            )}
          </section>
        ) : null}

        <Button asChild variant="soft" className="w-full">
          <Link href="/today">Back to today</Link>
        </Button>
      </div>
    </AppShell>
  )
}
