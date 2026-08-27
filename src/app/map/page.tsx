'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, RotateCcw, Sparkles, TrendingUp, Trophy, type LucideIcon } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { BecomingMap, BecomingMapSkeleton } from '@/components/map/becoming-map'
import { MapDayDrawer } from '@/components/map/map-day-drawer'
import { MapIdentityFilter } from '@/components/map/map-identity-filter'
import { MapLegend } from '@/components/map/map-legend'
import { MapRangeSelector } from '@/components/map/map-range-selector'
import { getMapData } from '@/lib/api/map'
import { getHabits } from '@/lib/api/habits'
import { getIdentities } from '@/lib/api/identities'
import { getDateRange } from '@/lib/utils'
// No challenges endpoint exists yet — the seed is the app's mock source of truth.
import { MOCK_CHALLENGES } from '@/data/seed'
import type { BecomingMapDay, MapRange } from '@/types'

const MS_PER_DAY = 86_400_000
/** How many days a habit or identity needs before the map calls it a pattern. */
const PATTERN_MIN_DAYS = 3
/** Change in active-day rate that counts as a real shift rather than noise. */
const TREND_THRESHOLD = 0.1

const RANGE_PHRASE: Record<MapRange, string> = {
  '30d': 'This month',
  '90d': 'These three months',
  '6m': 'These six months',
  '1y': 'This year',
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

interface StoryStat {
  key: string
  icon: LucideIcon
  label: string
  detail: string
}

interface MapStory {
  heading: string
  stats: StoryStat[]
}

/**
 * Turns the raw grid into a few sentences a person would actually say about
 * their last few months.
 */
function buildStory(days: BecomingMapDay[], range: MapRange): MapStory {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const active = sorted.filter(day => day.intensity > 0)

  const habitDays = new Map<string, number>()
  const identityDays = new Map<string, number>()
  for (const day of active) {
    for (const habitId of day.completedHabitIds) {
      habitDays.set(habitId, (habitDays.get(habitId) ?? 0) + 1)
    }
    for (const identityId of day.identityIds) {
      identityDays.set(identityId, (identityDays.get(identityId) ?? 0) + 1)
    }
  }
  const countPatterns = (counts: Map<string, number>): number =>
    Array.from(counts.values()).filter(count => count >= PATTERN_MIN_DAYS).length

  // A recovery day is one you started again on, right after a blank square.
  let recoveryDays = 0
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].intensity > 0 && sorted[i - 1].intensity === 0) recoveryDays++
  }

  const first = sorted[0]?.date ?? ''
  const last = sorted[sorted.length - 1]?.date ?? ''
  const challenges = MOCK_CHALLENGES.filter(
    challenge =>
      challenge.status === 'completed' &&
      challenge.completedAt !== undefined &&
      challenge.completedAt >= first &&
      challenge.completedAt <= last
  ).length

  // Compare the two halves of the window to describe the direction of travel.
  const midpoint = Math.floor(sorted.length / 2)
  const rateOf = (slice: BecomingMapDay[]): number =>
    slice.length === 0 ? 0 : slice.filter(day => day.intensity > 0).length / slice.length
  const earlyRate = rateOf(sorted.slice(0, midpoint))
  const lateRate = rateOf(sorted.slice(midpoint))

  let trend: string
  if (lateRate - earlyRate > TREND_THRESHOLD) trend = 'you became more consistent.'
  else if (earlyRate - lateRate > TREND_THRESHOLD) trend = 'you gave yourself more room.'
  else trend = 'you kept your rhythm steady.'

  return {
    heading: `${RANGE_PHRASE[range]}, ${trend}`,
    stats: [
      {
        key: 'active',
        icon: CalendarDays,
        label: plural(active.length, 'active day', 'active days'),
        detail: 'Days you did at least one small thing.',
      },
      {
        key: 'habits',
        icon: TrendingUp,
        label: `${countPatterns(habitDays)} habits strengthened`,
        detail: "You returned to these often enough that they're starting to hold.",
      },
      {
        key: 'identities',
        icon: Sparkles,
        label: `${countPatterns(identityDays)} identities growing`,
        detail: 'More than one version of you is getting practice.',
      },
      {
        key: 'recovery',
        icon: RotateCcw,
        label: plural(recoveryDays, 'recovery day', 'recovery days'),
        detail: 'Days you started again after a pause.',
      },
      {
        key: 'challenges',
        icon: Trophy,
        label: plural(challenges, 'personal challenge', 'personal challenges'),
        detail: 'You went past what you planned, on purpose.',
      },
    ],
  }
}

function MapSkeleton({ dayCount }: { dayCount: number }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 pt-10">
      <div className="space-y-2.5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-52 rounded-xl" />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-9 w-48 rounded-full" />
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <BecomingMapSkeleton dayCount={dayCount} />
        <div className="mt-4">
          <MapLegend />
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
        <Skeleton className="h-6 w-72" />
        {[0, 1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-10 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default function MapPage() {
  const router = useRouter()

  const [range, setRange] = useState<MapRange>('90d')
  const [identityFilter, setIdentityFilter] = useState<string | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const mapQuery = useQuery({
    queryKey: ['map', range, identityFilter],
    queryFn: () => getMapData(range, identityFilter),
  })
  const habitsQuery = useQuery({ queryKey: ['habits'], queryFn: getHabits })
  const identitiesQuery = useQuery({ queryKey: ['identities'], queryFn: getIdentities })

  const days = useMemo(() => mapQuery.data ?? [], [mapQuery.data])
  const habits = useMemo(() => habitsQuery.data ?? [], [habitsQuery.data])
  const identities = useMemo(() => identitiesQuery.data ?? [], [identitiesQuery.data])

  const story = useMemo(() => buildStory(days, range), [days, range])

  // Falls back to null when the selected day drops out of the current range,
  // which closes the drawer on its own.
  const selectedDay = useMemo(
    () => days.find(day => day.date === selectedDate) ?? null,
    [days, selectedDate]
  )

  const expectedDayCount = useMemo(() => {
    const { start, end } = getDateRange(range)
    return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
  }, [range])

  const handleSelectDay = useCallback((date: string) => {
    setSelectedDate(current => (current === date ? null : date))
  }, [])
  const handleCloseDrawer = useCallback(() => setSelectedDate(null), [])
  const handleIdentityChange = useCallback((identityId?: string) => setIdentityFilter(identityId), [])

  const isLoading = mapQuery.isLoading || habitsQuery.isLoading || identitiesQuery.isLoading
  const isError = mapQuery.isError || habitsQuery.isError || identitiesQuery.isError

  const handleRetry = useCallback(() => {
    void mapQuery.refetch()
    void habitsQuery.refetch()
    void identitiesQuery.refetch()
  }, [mapQuery, habitsQuery, identitiesQuery])

  if (isLoading) {
    return (
      <AppShell>
        <MapSkeleton dayCount={expectedDayCount} />
      </AppShell>
    )
  }

  if (isError) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-5 pt-10">
          <ErrorState message="Your map didn't load." onRetry={handleRetry} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 px-5 pt-10">
        {/* 1. Header */}
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Your Becoming Map</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Small actions, seen over time.</p>
        </header>

        {/* 2. Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <MapRangeSelector value={range} onChange={setRange} className="self-start shrink-0" />
          {identities.length > 0 && (
            <MapIdentityFilter
              identities={identities}
              value={identityFilter}
              onChange={handleIdentityChange}
              className="min-w-0 md:justify-end"
            />
          )}
        </div>

        {days.length === 0 ? (
          <EmptyState
            title="Your map starts with one small action."
            description="Check something off today and this grid begins filling in — one square at a time."
            action={{ label: 'Go to Today', onClick: () => router.push('/today') }}
          />
        ) : (
          <>
            {/* 3. The grid */}
            <section aria-label="Becoming map" className="rounded-3xl border border-border bg-card p-5">
              <BecomingMap
                days={days}
                onSelectDay={handleSelectDay}
                selectedDate={selectedDate}
              />
              <MapLegend className="mt-4" />
            </section>

            {/* 4. Story mode */}
            <section
              aria-labelledby="map-story-heading"
              className="rounded-3xl border border-border bg-card p-5"
            >
              <h2 id="map-story-heading" className="text-lg font-medium tracking-tight text-balance">
                {story.heading}
              </h2>
              <ul className="mt-4 space-y-3.5">
                {story.stats.map(stat => (
                  <li key={stat.key} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
                    >
                      <stat.icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{stat.label}</p>
                      <p className="text-sm text-muted-foreground">{stat.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      {/* 5. Day details */}
      <MapDayDrawer
        day={selectedDay}
        habits={habits}
        identities={identities}
        onClose={handleCloseDrawer}
      />
    </AppShell>
  )
}
