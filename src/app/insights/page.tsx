'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, X } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getInsights, updateInsight } from '@/lib/api/insights'
import { getIdentities } from '@/lib/api/identities'
import { cn, formatShortDate } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Identity, IdentityAccent, Insight, InsightStatus, InsightType } from '@/types'

/* -------------------------------------------------------------------------- */
/* Presentation maps                                                           */
/* -------------------------------------------------------------------------- */

const TYPE_META: Record<InsightType, { label: string; dot: string }> = {
  pattern: { label: 'Pattern', dot: 'bg-violet-500' },
  correlation: { label: 'Connection', dot: 'bg-blue-500' },
  suggestion: { label: 'Suggestion', dot: 'bg-amber-500' },
  milestone: { label: 'Milestone', dot: 'bg-emerald-500' },
  recovery: { label: 'Coming back', dot: 'bg-teal-500' },
}

const BADGE_VARIANT: Record<IdentityAccent, BadgeProps['variant']> = {
  violet: 'violet',
  indigo: 'violet',
  green: 'green',
  teal: 'green',
  blue: 'blue',
  rose: 'rose',
  amber: 'amber',
  orange: 'amber',
}

type FilterKey = 'all' | 'patterns' | 'suggestions' | 'saved'

const FILTERS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'patterns', label: 'Patterns' },
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'saved', label: 'Saved' },
]

const PATTERN_TYPES: ReadonlyArray<InsightType> = ['pattern', 'correlation', 'milestone']
const SUGGESTION_TYPES: ReadonlyArray<InsightType> = ['suggestion', 'recovery']

function matchesFilter(insight: Insight, filter: FilterKey): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'patterns':
      return PATTERN_TYPES.includes(insight.type)
    case 'suggestions':
      return SUGGESTION_TYPES.includes(insight.type)
    case 'saved':
      return insight.status === 'saved'
  }
}

const EMPTY_FILTER_COPY: Record<FilterKey, string> = {
  all: 'Nothing here right now. New noticings appear as you go.',
  patterns: 'No patterns under this filter yet. They need a few more days of your story.',
  suggestions: 'No suggestions right now. Nothing needs changing.',
  saved: 'Nothing saved yet. Tap the bookmark on anything you want to keep.',
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

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function InsightsPage() {
  const queryClient = useQueryClient()
  const { reducedMotion } = useAppStore()

  const insightsQuery = useQuery({ queryKey: ['insights'], queryFn: getInsights })
  const identitiesQuery = useQuery({ queryKey: ['identities'], queryFn: getIdentities })

  const [filter, setFilter] = useState<FilterKey>('all')
  /** Local status wins immediately, so saving and dismissing feel instant. */
  const [overrides, setOverrides] = useState<Record<string, InsightStatus>>({})
  const [announcement, setAnnouncement] = useState('')

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InsightStatus }) =>
      updateInsight(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insights'] })
    },
    onError: (_error, variables) => {
      setOverrides(previous => {
        const next = { ...previous }
        delete next[variables.id]
        return next
      })
      setAnnouncement("That didn't save. Nothing changed.")
    },
  })

  const identityById = useMemo(
    () => new Map<string, Identity>((identitiesQuery.data ?? []).map(item => [item.id, item])),
    [identitiesQuery.data]
  )

  const insights = useMemo(
    () =>
      (insightsQuery.data ?? [])
        .map(insight => ({ ...insight, status: overrides[insight.id] ?? insight.status }))
        .filter(insight => insight.status !== 'dismissed')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [insightsQuery.data, overrides]
  )

  const visible = useMemo(
    () => insights.filter(insight => matchesFilter(insight, filter)),
    [insights, filter]
  )

  const setStatus = useCallback(
    (insight: Insight, status: InsightStatus) => {
      setOverrides(previous => ({ ...previous, [insight.id]: status }))
      statusMutation.mutate({ id: insight.id, status })
    },
    [statusMutation]
  )

  const handleToggleSave = useCallback(
    (insight: Insight) => {
      const saving = insight.status !== 'saved'
      setStatus(insight, saving ? 'saved' : 'read')
      setAnnouncement(saving ? 'Saved to your collection.' : 'Removed from saved.')
    },
    [setStatus]
  )

  const handleDismiss = useCallback(
    (insight: Insight) => {
      setStatus(insight, 'dismissed')
      setAnnouncement('Set aside. It won’t come back.')
    },
    [setStatus]
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 px-5 pt-10">
        {/* 1. Header ------------------------------------------------------- */}
        <header className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">What we&rsquo;re noticing</h1>
          <p className="text-sm text-muted-foreground">Based on your recent activity.</p>
        </header>

        {/* 2. Filters ------------------------------------------------------ */}
        <div role="group" aria-label="Filter insights" className="flex flex-wrap gap-2">
          {FILTERS.map(item => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={pillClasses(filter === item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {/* 3. Feed --------------------------------------------------------- */}
        {insightsQuery.isPending ? (
          <div className="space-y-6">
            {[0, 1, 2].map(index => (
              <div key={index} className="space-y-4 rounded-3xl border border-border p-6">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-8 w-40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : insightsQuery.isError ? (
          <ErrorState
            message="We couldn't load what we've been noticing."
            onRetry={() => void insightsQuery.refetch()}
          />
        ) : insights.length === 0 ? (
          <EmptyState
            title="Nothing to notice yet."
            description="Becoming needs a little more of your story before patterns can appear."
          />
        ) : visible.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border p-6 text-sm leading-relaxed text-muted-foreground">
            {EMPTY_FILTER_COPY[filter]}
          </p>
        ) : (
          <div className="space-y-6 pb-6">
            <AnimatePresence initial={false}>
              {visible.map(insight => (
                <motion.article
                  key={insight.id}
                  layout={!reducedMotion}
                  initial={false}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.97, transition: { duration: 0.2 } }
                  }
                  className="space-y-4 rounded-3xl border border-border bg-card p-6"
                  aria-labelledby={`insight-${insight.id}-title`}
                >
                  <InsightCard
                    insight={insight}
                    identityById={identityById}
                    onToggleSave={handleToggleSave}
                    onDismiss={handleDismiss}
                  />
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppShell>
  )
}

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

interface InsightCardProps {
  insight: Insight
  identityById: Map<string, Identity>
  onToggleSave: (insight: Insight) => void
  onDismiss: (insight: Insight) => void
}

function InsightCard({ insight, identityById, onToggleSave, onDismiss }: InsightCardProps) {
  const meta = TYPE_META[insight.type]
  const saved = insight.status === 'saved'
  const habitId = insight.relatedHabitIds[0]
  const identities = insight.relatedIdentityIds
    .map(id => identityById.get(id))
    .filter((identity): identity is Identity => identity !== undefined)

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </p>
        <p className="text-[10px] text-muted-foreground">{formatShortDate(insight.createdAt)}</p>
      </div>

      <h2 id={`insight-${insight.id}-title`} className="text-xl font-medium leading-snug text-balance">
        {insight.title}
      </h2>

      <p className="text-sm leading-relaxed">{insight.summary}</p>

      <div className="rounded-2xl bg-secondary/50 p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Evidence
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.evidence}</p>
      </div>

      {identities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {identities.map(identity => (
            <Badge key={identity.id} variant={BADGE_VARIANT[identity.accent]}>
              <span aria-hidden="true">{identity.icon}</span>
              {identity.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {habitId && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/habits/${habitId}`}>Adjust habit</Link>
          </Button>
        )}

        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/companion">Talk about this</Link>
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={saved}
            aria-label={saved ? `Unsave ${insight.title}` : `Save ${insight.title}`}
            onClick={() => onToggleSave(insight)}
            className={saved ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}
          >
            <Bookmark
              className="h-4 w-4"
              strokeWidth={1.75}
              fill={saved ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Set aside ${insight.title}`}
            onClick={() => onDismiss(insight)}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  )
}
