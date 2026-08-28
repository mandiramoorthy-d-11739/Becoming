'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { SectionHeader } from '@/components/layout/section-header'
import { getIntensityClass } from '@/components/identities/identity-mini-map'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getIdentities } from '@/lib/api/identities'
import { getCheckins, getHabits } from '@/lib/api/habits'
import { getMapData } from '@/lib/api/map'
import { getInsights } from '@/lib/api/insights'
import { cn, formatDate, formatShortDate, getAccentColors, subDays, toDateString } from '@/lib/utils'
// No reflections endpoint exists yet — the seed is the app's mock source of truth.
import { MOCK_REFLECTIONS } from '@/data/seed'
import { useAppStore } from '@/store/app-store'
import type { BecomingMapDay, Habit, HabitCheckin, Identity, MapIntensity } from '@/types'

/* -------------------------------------------------------------------------- */
/* Habit formatting                                                            */
/* -------------------------------------------------------------------------- */

function formatTargetValue(habit: Habit): string {
  const { currentTarget: target, unit } = habit
  switch (habit.type) {
    case 'binary':
      return 'Once'
    case 'duration':
      return `${target} ${unit ?? 'minutes'}`
    case 'count':
      return `${target}×`
    case 'reduction':
      return `Under ${target} ${unit ?? ''}`.trim()
    case 'quantity':
    default:
      return `${target} ${unit ?? ''}`.trim()
  }
}

function formatFrequency(habit: Habit): string {
  const { frequency, daysOfWeek } = habit.schedule
  switch (frequency) {
    case 'daily':
      return 'Every day'
    case 'weekdays':
      return 'Weekdays'
    case 'weekends':
      return 'Weekends'
    case 'custom':
    default: {
      const count = daysOfWeek?.length ?? 0
      return count > 0 ? `${count} days a week` : 'Your own rhythm'
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 14-day completion strip                                                     */
/* -------------------------------------------------------------------------- */

function lastNDates(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => toDateString(subDays(today, n - 1 - i)))
}

function HabitStrip({
  habit,
  checkins,
  dates,
  accent,
}: {
  habit: Habit
  checkins: HabitCheckin[]
  dates: string[]
  accent: Identity['accent']
}) {
  const byDate = new Map(checkins.map((c) => [c.date, c]))
  const completed = dates.filter((d) => byDate.get(d)?.status === 'complete').length

  return (
    <div
      className="flex shrink-0 gap-[3px]"
      role="img"
      aria-label={`${habit.name}: ${completed} of the last ${dates.length} days completed`}
    >
      {dates.map((date) => {
        const status = byDate.get(date)?.status
        const intensity: MapIntensity = status === 'complete' ? 4 : status === 'partial' ? 2 : 0
        return (
          <span
            key={date}
            aria-hidden="true"
            className={cn('h-2.5 w-1.5 rounded-[2px]', getIntensityClass(accent, intensity))}
          />
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Milestones                                                                  */
/* -------------------------------------------------------------------------- */

interface Milestone {
  title: string
  detail: string
}

const MILESTONES_BY_SLUG: Record<string, Milestone[]> = {
  calmer: [
    { title: 'Meditation grew from 2 to 3 minutes', detail: 'It took two attempts. The second one stayed.' },
    { title: 'Ten quieter nights in a row', detail: 'Late-night scrolling stayed under 20 minutes.' },
  ],
  healthier: [
    { title: 'Morning walk grew from 10 to 20 minutes', detail: 'Two small steps, eight weeks apart.' },
    { title: 'Water stopped needing a reminder', detail: 'You reached 2L on most days without tracking it.' },
  ],
  social: [
    { title: 'Reached out 30 times', detail: 'Short messages, real openings.' },
    { title: 'Made plans two weekends in a row', detail: 'It felt less effortful the second time.' },
  ],
}

function buildMilestones(identity: Identity, activeDays: number): Milestone[] {
  const curated = MILESTONES_BY_SLUG[identity.slug] ?? [
    { title: 'You made a start', detail: 'The first week is the one most people never reach.' },
  ]
  return [
    {
      title: `${activeDays} days of showing up for ${identity.name}`,
      detail: 'Not in a straight line — but you kept returning.',
    },
    ...curated,
  ].slice(0, 3)
}

/* -------------------------------------------------------------------------- */
/* Companion insight fallback                                                  */
/* -------------------------------------------------------------------------- */

const INSIGHT_FALLBACK_BY_SLUG: Record<string, string> = {
  calmer: 'Your calmest weeks are the ones where meditation came before the phone, not after it.',
  healthier: 'On the mornings you walk, you finish more of everything else you planned.',
  social: 'Reaching out gets easier when it stays small. Your shortest messages get the warmest replies.',
}

/* -------------------------------------------------------------------------- */
/* Reflections                                                                 */
/* -------------------------------------------------------------------------- */

interface ReflectionEntry {
  id: string
  date: string
  text: string
}

function buildReflections(identityId: string, habitIds: Set<string>, checkins: HabitCheckin[]): ReflectionEntry[] {
  const fromSeed: ReflectionEntry[] = MOCK_REFLECTIONS.filter(
    (r) => r.identityId === identityId || (r.habitId !== undefined && habitIds.has(r.habitId))
  ).map((r) => ({ id: r.id, date: r.date, text: r.response }))

  const fromNotes: ReflectionEntry[] = checkins
    .filter((c) => Boolean(c.note))
    .map((c) => ({ id: c.id, date: c.date, text: c.note as string }))

  return [...fromSeed, ...fromNotes]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
}

/* -------------------------------------------------------------------------- */
/* 90-day grid                                                                 */
/* -------------------------------------------------------------------------- */

function OverTimeGrid({ days, accent }: { days: BecomingMapDay[]; accent: Identity['accent'] }) {
  const recent = days.slice(-90)
  if (recent.length === 0) {
    return <Skeleton className="h-32 rounded-2xl" />
  }

  const leadingBlanks = new Date(`${recent[0].date}T00:00:00`).getDay()
  const activeDays = recent.filter((d) => d.intensity > 0).length

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div
        className="grid grid-flow-col grid-rows-7 justify-start gap-1"
        role="img"
        aria-label={`${activeDays} active days between ${formatShortDate(recent[0].date)} and ${formatShortDate(
          recent[recent.length - 1].date
        )}`}
      >
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} className="h-3 w-3" aria-hidden="true" />
        ))}
        {recent.map((day) => (
          <span
            key={day.date}
            aria-hidden="true"
            title={`${formatShortDate(day.date)} — ${day.completedHabitIds.length} completed`}
            className={cn('h-3 w-3 rounded-[3px]', getIntensityClass(accent, day.intensity))}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Last 90 days</span>
        <span className="flex items-center gap-1.5">
          Less
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              aria-hidden="true"
              className={cn('h-2.5 w-2.5 rounded-[2px]', getIntensityClass(accent, level))}
            />
          ))}
          More
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function IdentityDetailPage() {
  const params = useParams<{ identityId: string }>()
  const identityId = params.identityId
  const { reducedMotion } = useAppStore()

  const identitiesQuery = useQuery({ queryKey: ['identities'], queryFn: getIdentities })
  const habitsQuery = useQuery({ queryKey: ['habits'], queryFn: getHabits })
  const checkinsQuery = useQuery({ queryKey: ['checkins'], queryFn: () => getCheckins() })
  const mapQuery = useQuery({
    queryKey: ['map', '90d', identityId],
    queryFn: () => getMapData('90d', identityId),
  })
  const insightsQuery = useQuery({ queryKey: ['insights'], queryFn: getInsights })

  const identity = identitiesQuery.data?.find((i) => i.id === identityId)

  const identityHabits = useMemo(
    () => (habitsQuery.data ?? []).filter((h) => h.identityId === identityId && h.status !== 'archived'),
    [habitsQuery.data, identityId]
  )

  const habitIds = useMemo(() => new Set(identityHabits.map((h) => h.id)), [identityHabits])

  const identityCheckins = useMemo(
    () => (checkinsQuery.data ?? []).filter((c) => habitIds.has(c.habitId)),
    [checkinsQuery.data, habitIds]
  )

  const activeDays = useMemo(
    () => new Set(identityCheckins.filter((c) => c.status === 'complete').map((c) => c.date)).size,
    [identityCheckins]
  )

  const dates = useMemo(() => lastNDates(14), [])

  const reflections = useMemo(
    () => buildReflections(identityId, habitIds, identityCheckins),
    [identityId, habitIds, identityCheckins]
  )

  const insight = useMemo(
    () => (insightsQuery.data ?? []).find((i) => i.relatedIdentityIds.includes(identityId)),
    [insightsQuery.data, identityId]
  )

  if (identitiesQuery.isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-8 px-5 pt-10">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </AppShell>
    )
  }

  if (!identity) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6 px-5 pt-10 text-center">
          <h1 className="text-2xl font-semibold">This direction isn&rsquo;t here anymore.</h1>
          <p className="text-sm text-muted-foreground">
            It may have been archived. Everything else is still where you left it.
          </p>
          <Button asChild variant="soft">
            <Link href="/you">Back to you</Link>
          </Button>
        </div>
      </AppShell>
    )
  }

  const accent = getAccentColors(identity.accent)
  const milestones = buildMilestones(identity, activeDays)

  const header = (
    <div className="flex items-start gap-4">
      <div
        className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-3xl', accent.soft)}
        aria-hidden="true"
      >
        {identity.icon}
      </div>
      <div className="min-w-0 space-y-1 pt-1">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{identity.name}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{identity.description}</p>
      </div>
    </div>
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8 px-5 pt-10">
        {/* 1. Back --------------------------------------------------------- */}
        <Link
          href="/you"
          className="inline-flex items-center gap-1.5 rounded-xl text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Back
        </Link>

        {/* 2. Header ------------------------------------------------------- */}
        {reducedMotion ? (
          header
        ) : (
          <motion.div layoutId={`identity-${identity.id}`}>{header}</motion.div>
        )}

        {/* 3. Small steps -------------------------------------------------- */}
        <section className="space-y-4">
          <SectionHeader title="Small steps" />

          {habitsQuery.isPending ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : identityHabits.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No steps yet. Start with something small enough that it feels almost too easy.
            </p>
          ) : (
            <ul className="space-y-2">
              {identityHabits.map((habit) => (
                <li key={habit.id}>
                  <Link
                    href={`/habits/${habit.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{habit.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatTargetValue(habit)} · {formatFrequency(habit)}
                      </p>
                    </div>
                    <HabitStrip
                      habit={habit}
                      checkins={identityCheckins.filter((c) => c.habitId === habit.id)}
                      dates={dates}
                      accent={identity.accent}
                    />
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. Over time ---------------------------------------------------- */}
        <section className="space-y-4">
          <SectionHeader title="Over time" />
          {mapQuery.isPending ? (
            <Skeleton className="h-44 rounded-3xl" />
          ) : (
            <OverTimeGrid days={mapQuery.data ?? []} accent={identity.accent} />
          )}
        </section>

        {/* 5. Milestones --------------------------------------------------- */}
        <section className="space-y-4">
          <SectionHeader title="Milestones" />
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.title} className={cn('rounded-3xl p-5', accent.soft)}>
                <p className="text-sm font-medium text-balance">{milestone.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{milestone.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Reflections -------------------------------------------------- */}
        <section className="space-y-4">
          <SectionHeader title="Reflections" />
          {reflections.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              Nothing written down yet. Your notes will gather here as you go.
            </p>
          ) : (
            <div className="space-y-3">
              {reflections.map((reflection) => (
                <blockquote key={reflection.id} className="rounded-3xl border border-border bg-card p-5">
                  <p className="text-sm italic leading-relaxed text-balance">
                    &ldquo;{reflection.text}&rdquo;
                  </p>
                  <footer className="mt-2 text-xs text-muted-foreground">
                    {formatDate(reflection.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}
        </section>

        {/* 7. Companion insight -------------------------------------------- */}
        <section className="space-y-4">
          <SectionHeader title="Companion insight" />
          <div className="rounded-3xl bg-violet-50 p-5 dark:bg-violet-950/30">
            <div className="flex items-start gap-3">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-1">
                <p className="text-sm leading-relaxed text-violet-900 dark:text-violet-200 text-balance">
                  {insight?.summary ??
                    INSIGHT_FALLBACK_BY_SLUG[identity.slug] ??
                    `You've returned to ${identity.name} more often than you've walked away from it.`}
                </p>
                {insight?.evidence && (
                  <p className="text-xs leading-relaxed text-violet-700/80 dark:text-violet-300/70">
                    {insight.evidence}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 8. CTA ---------------------------------------------------------- */}
        <div className="pb-4">
          <Button asChild variant="primary" className="w-full">
            <Link href={`/habits/new?identity=${identity.id}`}>Add a small step</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
