'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { SectionHeader } from '@/components/layout/section-header'
import { IdentityCard } from '@/components/identities/identity-card'
import { StaggerChildren, StaggerItem } from '@/components/motion/stagger-children'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getUser } from '@/lib/api/user'
import { getIdentities } from '@/lib/api/identities'
import { getCheckins, getHabits } from '@/lib/api/habits'
import { getMapData } from '@/lib/api/map'
import { cn, formatDate, subDays } from '@/lib/utils'
import type { BecomingMapDay, Habit, HabitCheckin, Identity, IdentityAccent } from '@/types'

/* -------------------------------------------------------------------------- */
/* Identity sentence                                                           */
/* -------------------------------------------------------------------------- */

const DESCRIPTOR_BY_SLUG: Record<string, string> = {
  calmer: 'calmer',
  healthier: 'healthier',
  stronger: 'stronger',
  focused: 'more focused',
  social: 'more socially connected',
  rested: 'better rested',
  creative: 'more creative',
  disciplined: 'more disciplined',
  'smoke-free': 'smoke-free',
}

function descriptorFor(identity: Identity): string {
  return (
    DESCRIPTOR_BY_SLUG[identity.slug] ??
    identity.name.replace(/\s*\bme\b\s*$/i, '').trim().toLowerCase()
  )
}

function buildBecomingSentence(identities: Identity[]): string {
  const parts = identities.map(descriptorFor).filter(Boolean)
  if (parts.length === 0) return 'Becoming, one small step at a time.'
  if (parts.length === 1) return `Becoming ${parts[0]}.`
  if (parts.length === 2) return `Becoming ${parts[0]} and ${parts[1]}.`
  return `Becoming ${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}.`
}

/* -------------------------------------------------------------------------- */
/* Story timeline                                                              */
/* -------------------------------------------------------------------------- */

interface StoryEntry {
  daysAgo: number
  title: string
  description?: string
  accent: IdentityAccent
}

const STORY_ENTRIES: StoryEntry[] = [
  { daysAgo: 120, title: 'Started Becoming', accent: 'indigo' },
  { daysAgo: 120, title: 'Added Calmer Me', accent: 'violet' },
  { daysAgo: 110, title: 'First 7-day rhythm', accent: 'violet' },
  { daysAgo: 105, title: 'Added More Social Me', accent: 'rose' },
  { daysAgo: 85, title: 'Morning walk grew to 15 minutes', accent: 'green' },
  {
    daysAgo: 60,
    title: 'Tried 3-minute meditation — came back to 2',
    description: 'A pause, not a setback.',
    accent: 'violet',
  },
  {
    daysAgo: 55,
    title: 'Completed first personal challenge',
    description: 'Stayed with it for 4m 18s.',
    accent: 'amber',
  },
  { daysAgo: 48, title: 'Meditation settled at 3 minutes', accent: 'violet' },
  { daysAgo: 41, title: 'Morning walk grew to 20 minutes', accent: 'green' },
  {
    daysAgo: 19,
    title: 'Returned after a 3-day pause',
    description: 'Progress was still here.',
    accent: 'teal',
  },
]

const DOT_CLASSES: Record<IdentityAccent, string> = {
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
  green: 'bg-emerald-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
}

/* -------------------------------------------------------------------------- */
/* Weekly reflection copy                                                      */
/* -------------------------------------------------------------------------- */

const WEEK_ROWS: Array<{ label: string; body: string }> = [
  { label: 'Biggest win', body: 'You walked four mornings in a row.' },
  { label: 'Hardest moment', body: 'Wednesday night — the scrolling won.' },
  { label: 'What changed', body: 'Meditation stopped feeling like a task.' },
  { label: 'Carry forward', body: 'Start the day outside, before the laptop.' },
]

/* -------------------------------------------------------------------------- */
/* Derived identity stats                                                      */
/* -------------------------------------------------------------------------- */

interface IdentityView {
  identity: Identity
  habitCount: number
  activeDays: number
  recentNote?: string
  miniMapDays: BecomingMapDay[]
}

function buildIdentityViews(
  identities: Identity[],
  habits: Habit[],
  checkins: HabitCheckin[],
  mapDays: BecomingMapDay[]
): IdentityView[] {
  return identities.map((identity) => {
    const identityHabits = habits.filter((h) => h.identityId === identity.id)
    const habitIds = new Set(identityHabits.map((h) => h.id))
    const identityCheckins = checkins.filter((c) => habitIds.has(c.habitId))

    const activeDays = new Set(
      identityCheckins.filter((c) => c.status === 'complete').map((c) => c.date)
    ).size

    const recentNote = [...identityCheckins]
      .filter((c) => Boolean(c.note))
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.note

    const miniMapDays = mapDays.map((day) => ({
      ...day,
      intensity: day.identityIds.includes(identity.id) ? day.intensity : (0 as const),
    }))

    return {
      identity,
      habitCount: identityHabits.length,
      activeDays,
      recentNote,
      miniMapDays,
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function YouPage() {
  const userQuery = useQuery({ queryKey: ['user'], queryFn: getUser })
  const identitiesQuery = useQuery({ queryKey: ['identities'], queryFn: getIdentities })
  const habitsQuery = useQuery({ queryKey: ['habits'], queryFn: getHabits })
  const checkinsQuery = useQuery({ queryKey: ['checkins'], queryFn: () => getCheckins() })
  const mapQuery = useQuery({ queryKey: ['map', '90d'], queryFn: () => getMapData('90d') })

  const user = userQuery.data
  const identities = useMemo(
    () => (identitiesQuery.data ?? []).filter((i) => i.status === 'active'),
    [identitiesQuery.data]
  )

  const identityViews = useMemo(
    () =>
      buildIdentityViews(
        identities,
        habitsQuery.data ?? [],
        checkinsQuery.data ?? [],
        mapQuery.data ?? []
      ),
    [identities, habitsQuery.data, checkinsQuery.data, mapQuery.data]
  )

  const sentence = useMemo(() => buildBecomingSentence(identities), [identities])

  const story = useMemo(() => {
    const today = new Date()
    return STORY_ENTRIES.map((entry) => ({
      ...entry,
      dateLabel: formatDate(subDays(today, entry.daysAgo), {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }))
  }, [])

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-10 px-5 pt-10">
        {/* 1. Header ------------------------------------------------------- */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {user ? (
              user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                  aria-hidden="true"
                >
                  {user.firstName.charAt(0)}
                </div>
              )
            ) : (
              <Skeleton className="h-16 w-16 rounded-full" />
            )}

            <div className="min-w-0 space-y-1">
              {user ? (
                <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
              ) : (
                <Skeleton className="h-7 w-40" />
              )}
              {identitiesQuery.isPending ? (
                <Skeleton className="h-5 w-56" />
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground text-balance">{sentence}</p>
              )}
            </div>
          </div>

          <Button asChild variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
            <Link href="/settings" aria-label="Settings">
              <Settings className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          </Button>
        </header>

        {/* 2. Your directions ---------------------------------------------- */}
        <section className="space-y-4">
          <SectionHeader
            title="Your directions"
            action={
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/onboarding">Add another direction</Link>
              </Button>
            }
          />

          {identitiesQuery.isPending ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-44 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {identityViews.map((view) => (
                <IdentityCard
                  key={view.identity.id}
                  identity={view.identity}
                  habitCount={view.habitCount}
                  activeDays={view.activeDays}
                  recentNote={view.recentNote}
                  miniMapDays={view.miniMapDays}
                />
              ))}
            </div>
          )}
        </section>

        {/* 3. This week ----------------------------------------------------- */}
        <section className="space-y-4">
          <SectionHeader title="This week" />

          <div className="rounded-3xl border border-border bg-card p-6">
            <h3 className="text-lg font-medium">This week felt steadier.</h3>

            <dl className="mt-5 space-y-4">
              {WEEK_ROWS.map((row) => (
                <div key={row.label} className="space-y-1">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="text-sm leading-relaxed">{row.body}</dd>
                </div>
              ))}
            </dl>

            <Button asChild variant="soft" className="mt-6 w-full">
              <Link href="/reflection/weekly">Reflect on this week</Link>
            </Button>
          </div>
        </section>

        {/* 4. Your story ---------------------------------------------------- */}
        <section className="space-y-4 pb-4">
          <SectionHeader title="Your story" />

          <StaggerChildren className="relative">
            {story.map((entry, index) => (
              <StaggerItem key={`${entry.daysAgo}-${entry.title}`}>
                <div className="flex gap-4">
                  <div className="flex w-3 shrink-0 flex-col items-center pt-1.5">
                    <span
                      className={cn('h-2 w-2 shrink-0 rounded-full', DOT_CLASSES[entry.accent])}
                      aria-hidden="true"
                    />
                    {index < story.length - 1 && (
                      <span className="w-px flex-1 bg-border" aria-hidden="true" />
                    )}
                  </div>

                  <div className={cn('min-w-0 space-y-0.5', index < story.length - 1 && 'pb-6')}>
                    <p className="text-xs text-muted-foreground">{entry.dateLabel}</p>
                    <p className="text-sm font-medium leading-snug text-balance">{entry.title}</p>
                    {entry.description && (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>
      </div>
    </AppShell>
  )
}
