'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/app-shell'
import { CompanionOrb } from '@/components/companion/companion-orb'
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { HabitCard, isHabitComplete } from '@/components/habits/habit-card'
import { HabitTimer } from '@/components/habits/habit-timer'
import { DailyProgressArc } from '@/components/habits/daily-progress-arc'
import { createCheckin, getCheckins, getHabits, updateHabit } from '@/lib/api/habits'
import { getIdentities } from '@/lib/api/identities'
import { getUser } from '@/lib/api/user'
import { cn, formatDate, getGreeting, subDays, toDateString } from '@/lib/utils'
import type {
  CheckinStatus,
  ComfortRating as ComfortRatingValue,
  Habit,
  HabitCheckin,
  Identity,
  MoodLevel,
  SentimentLabel,
} from '@/types'

const MOOD_OPTIONS: ReadonlyArray<{ value: MoodLevel; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'effortful', label: 'Effortful' },
  { value: 'hard', label: 'Hard' },
]

const REFLECTION_OPTIONS: ReadonlyArray<{ value: SentimentLabel; label: string }> = [
  { value: 'positive', label: 'Lighter than usual' },
  { value: 'neutral', label: 'Steady' },
  { value: 'challenging', label: 'A bit of a push' },
  { value: 'difficult', label: 'Heavy' },
]

/** ISO weekday: 1 = Monday … 7 = Sunday, matching Habit.schedule.daysOfWeek. */
function isoDayOfWeek(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function isScheduledOn(habit: Habit, date: Date): boolean {
  const day = isoDayOfWeek(date)
  switch (habit.schedule.frequency) {
    case 'daily':
      return true
    case 'weekdays':
      return day <= 5
    case 'weekends':
      return day >= 6
    case 'custom':
      return habit.schedule.daysOfWeek?.includes(day) ?? true
  }
}

function resolveStatus(habit: Habit, value: number): CheckinStatus {
  if (habit.type === 'reduction') return value <= habit.currentTarget ? 'complete' : 'partial'
  if (value >= habit.currentTarget) return 'complete'
  return value > 0 ? 'partial' : 'missed'
}

function roundValue(value: number): number {
  return Math.round(value * 10) / 10
}

function pillClasses(selected: boolean): string {
  return cn(
    'h-8 rounded-full border px-3.5 text-xs font-medium transition-all select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
    'active:scale-[0.98]',
    selected
      ? 'border-transparent bg-violet-600 text-white shadow-sm'
      : 'border-border bg-card text-muted-foreground hover:border-violet-300 hover:text-foreground dark:hover:border-violet-700'
  )
}

function TodaySkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-5 pt-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="h-4 w-44 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-40 rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <div className="flex justify-center py-2">
        <Skeleton className="h-[140px] w-[140px] rounded-full" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="h-[108px] w-full rounded-3xl" />
        ))}
      </div>

      <Skeleton className="h-36 w-full rounded-3xl" />
    </div>
  )
}

export default function TodayPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const habitsQuery = useQuery({ queryKey: ['habits'], queryFn: getHabits })
  const identitiesQuery = useQuery({ queryKey: ['identities'], queryFn: getIdentities })
  const checkinsQuery = useQuery({ queryKey: ['checkins'], queryFn: () => getCheckins() })
  const userQuery = useQuery({ queryKey: ['user'], queryFn: getUser })

  // Optimistic check-ins keyed by habit id — they win over anything the API returns.
  const [optimistic, setOptimistic] = useState<Record<string, HabitCheckin>>({})
  const [mood, setMood] = useState<MoodLevel | null>(null)
  const [reflection, setReflection] = useState<SentimentLabel | null>(null)
  const [reflectionNote, setReflectionNote] = useState('')
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [timerHabit, setTimerHabit] = useState<Habit | null>(null)
  const [timerOpen, setTimerOpen] = useState(false)

  const today = useMemo(() => toDateString(new Date()), [])
  const todayLabel = useMemo(
    () => formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  )

  const habits = useMemo(() => habitsQuery.data ?? [], [habitsQuery.data])
  const identities = useMemo(() => identitiesQuery.data ?? [], [identitiesQuery.data])
  const checkins = useMemo(() => checkinsQuery.data ?? [], [checkinsQuery.data])
  const user = userQuery.data

  const identityById = useMemo(
    () => new Map<string, Identity>(identities.map(identity => [identity.id, identity])),
    [identities]
  )

  const serverCheckinsToday = useMemo(
    () => new Map<string, HabitCheckin>(checkins.filter(c => c.date === today).map(c => [c.habitId, c])),
    [checkins, today]
  )

  const checkinFor = useCallback(
    (habitId: string): HabitCheckin | undefined => optimistic[habitId] ?? serverCheckinsToday.get(habitId),
    [optimistic, serverCheckinsToday]
  )

  const activeHabits = useMemo(() => habits.filter(habit => habit.status === 'active'), [habits])

  const todaysHabits = useMemo(
    () =>
      activeHabits.filter(
        habit => identityById.has(habit.identityId) && isScheduledOn(habit, new Date())
      ),
    [activeHabits, identityById]
  )

  const completedCount = useMemo(
    () => todaysHabits.filter(habit => isHabitComplete(habit, checkinFor(habit.id))).length,
    [todaysHabits, checkinFor]
  )

  const checkinMutation = useMutation({
    mutationFn: (draft: Omit<HabitCheckin, 'id' | 'createdAt'>) => createCheckin(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkins'] })
    },
    onError: (_error, draft) => {
      setOptimistic(prev => {
        const next = { ...prev }
        delete next[draft.habitId]
        return next
      })
    },
  })

  const saveCheckin = useCallback(
    (
      habit: Habit,
      patch: Pick<HabitCheckin, 'status'> &
        Partial<Pick<HabitCheckin, 'actualValue' | 'comfortRating' | 'note'>>
    ) => {
      const draft: Omit<HabitCheckin, 'id' | 'createdAt'> = {
        habitId: habit.id,
        userId: habit.userId,
        date: today,
        targetValue: habit.currentTarget,
        ...patch,
      }
      setOptimistic(prev => ({
        ...prev,
        [habit.id]: { ...draft, id: `optimistic_${habit.id}_${today}`, createdAt: new Date().toISOString() },
      }))
      checkinMutation.mutate(draft)
    },
    [checkinMutation, today]
  )

  const handleComplete = useCallback(
    (habit: Habit, comfortRating?: ComfortRatingValue) => {
      const current = checkinFor(habit.id)
      if (!comfortRating && isHabitComplete(habit, current)) {
        // Tapping a finished habit again undoes it.
        saveCheckin(habit, { status: 'missed', actualValue: 0 })
        return
      }
      saveCheckin(habit, {
        status: 'complete',
        actualValue: habit.currentTarget,
        ...(comfortRating ? { comfortRating } : {}),
      })
    },
    [checkinFor, saveCheckin]
  )

  const handleSkip = useCallback(
    (habit: Habit) => {
      saveCheckin(habit, { status: 'skipped' })
    },
    [saveCheckin]
  )

  const handleIncrement = useCallback(
    (habit: Habit, delta: number) => {
      const current = checkinFor(habit.id)
      const value = Math.max(0, roundValue((current?.actualValue ?? 0) + delta))
      saveCheckin(habit, { status: resolveStatus(habit, value), actualValue: value })
    },
    [checkinFor, saveCheckin]
  )

  const handleStartTimer = useCallback((habit: Habit) => {
    setTimerHabit(habit)
    setTimerOpen(true)
  }, [])

  const handleTimerComplete = useCallback(
    (comfortRating: ComfortRatingValue) => {
      if (!timerHabit) return
      handleComplete(timerHabit, comfortRating)
    },
    [handleComplete, timerHabit]
  )

  const easeMutation = useMutation({
    mutationFn: ({ habitId, currentTarget }: { habitId: string; currentTarget: number }) =>
      updateHabit(habitId, { currentTarget }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  const handleMakeEasier = useCallback(
    (habit: Habit) => {
      // Reductions get more room; everything else gets a smaller ask.
      const proposed =
        habit.type === 'reduction'
          ? roundValue(habit.currentTarget * 1.4)
          : Math.max(habit.type === 'quantity' ? 0.2 : 1, roundValue(habit.currentTarget * 0.6))
      if (proposed === habit.currentTarget) return
      easeMutation.mutate({ habitId: habit.id, currentTarget: proposed })
    },
    [easeMutation]
  )

  const companionNote = useMemo(() => {
    const weekStart = toDateString(subDays(new Date(), 6))
    const counts = new Map<string, number>()
    for (const checkin of checkins) {
      if (checkin.status !== 'complete') continue
      if (checkin.date < weekStart || checkin.date > today) continue
      counts.set(checkin.habitId, (counts.get(checkin.habitId) ?? 0) + 1)
    }
    let topHabitId = ''
    let topCount = 0
    counts.forEach((count, habitId) => {
      if (count > topCount) {
        topCount = count
        topHabitId = habitId
      }
    })
    const habit = habits.find(h => h.id === topHabitId)
    if (habit && topCount >= 3) {
      return `You've done your ${habit.name.toLowerCase()} ${topCount} times this week. That's becoming a pattern.`
    }
    if (completedCount > 0) {
      return "You showed up today. That's the part that compounds."
    }
    return "You don't have to do all of it today. One small thing still counts."
  }, [checkins, habits, today, completedCount])

  const isLoading =
    habitsQuery.isLoading || identitiesQuery.isLoading || checkinsQuery.isLoading || userQuery.isLoading
  const isError = habitsQuery.isError || identitiesQuery.isError || checkinsQuery.isError || userQuery.isError

  const handleRetry = useCallback(() => {
    void habitsQuery.refetch()
    void identitiesQuery.refetch()
    void checkinsQuery.refetch()
    void userQuery.refetch()
  }, [habitsQuery, identitiesQuery, checkinsQuery, userQuery])

  if (isLoading) {
    return (
      <AppShell>
        <TodaySkeleton />
      </AppShell>
    )
  }

  if (isError || !user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 pt-10">
          <ErrorState message="Today didn't load." onRetry={handleRetry} />
        </div>
      </AppShell>
    )
  }

  if (activeHabits.length === 0) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-5 pt-10">
          <EmptyState
            title="Nothing to track yet—and that's okay."
            description="Start with who you want to become. The habits come after, and they can be small."
            action={{
              label: 'Choose who you want to become',
              onClick: () => router.push('/onboarding'),
            }}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8 px-5 pt-10">
        {/* 1. Greeting */}
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">{getGreeting(user.firstName)}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{todayLabel}</p>
          </div>
          <Link
            href="/companion"
            aria-label="Open your companion"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <CompanionOrb style={user.companionStyle} size="md" />
          </Link>
        </header>

        {/* 2. Mood quick check-in */}
        <section aria-labelledby="mood-heading" className="space-y-3">
          <h2 id="mood-heading" className="text-sm font-medium">
            How are you today?
          </h2>
          <div role="group" aria-labelledby="mood-heading" className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                aria-pressed={mood === option.value}
                className={pillClasses(mood === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {mood && (
              <motion.p
                key="mood-confirmation"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="text-xs text-muted-foreground"
                role="status"
              >
                Noted. Thanks for checking in.
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* 3. Daily progress */}
        <section aria-label="Today's progress" className="flex justify-center py-2">
          <DailyProgressArc completed={completedCount} total={todaysHabits.length} />
        </section>

        {/* 4. Habits scheduled for today */}
        <section aria-labelledby="habits-heading" className="space-y-3">
          <h2 id="habits-heading" className="sr-only">
            Today&rsquo;s habits
          </h2>
          {todaysHabits.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-6 text-center">
              <p className="text-sm font-medium">Nothing scheduled today.</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Rest is part of the rhythm. Your progress is still here.
              </p>
            </div>
          ) : (
            <StaggerChildren className="space-y-3">
              {todaysHabits.map(habit => {
                const identity = identityById.get(habit.identityId)
                if (!identity) return null
                return (
                  <StaggerItem key={habit.id}>
                    <HabitCard
                      habit={habit}
                      identity={identity}
                      checkin={checkinFor(habit.id)}
                      onComplete={handleComplete}
                      onSkip={handleSkip}
                      onStartTimer={handleStartTimer}
                      onIncrement={handleIncrement}
                      onMakeEasier={handleMakeEasier}
                    />
                  </StaggerItem>
                )
              })}
            </StaggerChildren>
          )}
        </section>

        {/* 5. Companion note */}
        <section
          aria-label="A note from your companion"
          className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5 dark:border-violet-900/50 dark:bg-violet-950/25"
        >
          <div className="flex items-start gap-4">
            <CompanionOrb style={user.companionStyle} size="sm" animate={false} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm leading-relaxed text-violet-900 dark:text-violet-100">{companionNote}</p>
              <Button asChild variant="soft" size="sm">
                <Link href="/companion">Talk about today</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 6. Reflection prompt */}
        {completedCount >= 2 && (
          <section aria-labelledby="reflection-heading" className="rounded-3xl border border-border bg-card p-5">
            <h2 id="reflection-heading" className="text-sm font-medium">
              How did today feel?
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              A few seconds of noticing is enough. Nobody sees this but you.
            </p>

            <div role="group" aria-labelledby="reflection-heading" className="mt-4 flex flex-wrap gap-2">
              {REFLECTION_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setReflection(option.value)
                    setReflectionSaved(false)
                  }}
                  aria-pressed={reflection === option.value}
                  className={pillClasses(reflection === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <AnimatePresence initial={false}>
              {reflection && !reflectionSaved && (
                <motion.div
                  key="reflection-note"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    <label htmlFor="reflection-note" className="sr-only">
                      Anything you want to remember about today
                    </label>
                    <Textarea
                      id="reflection-note"
                      value={reflectionNote}
                      onChange={event => setReflectionNote(event.target.value)}
                      placeholder="Anything you want to remember about today? (optional)"
                    />
                    <Button variant="primary" size="sm" onClick={() => setReflectionSaved(true)}>
                      Save reflection
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {reflectionSaved && (
                <motion.p
                  key="reflection-saved"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  role="status"
                  className="mt-4 text-xs text-muted-foreground"
                >
                  Saved. It&rsquo;s yours to look back on.
                </motion.p>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>

      {timerHabit && (
        <HabitTimer
          habit={timerHabit}
          open={timerOpen}
          onOpenChange={setTimerOpen}
          onComplete={handleTimerComplete}
        />
      )}
    </AppShell>
  )
}
