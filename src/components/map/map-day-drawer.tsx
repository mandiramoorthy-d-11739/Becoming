'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useMotionPreference } from '@/components/onboarding/use-motion-preference'
import { cn, formatDuration, getAccentColors } from '@/lib/utils'
import { formatMapDate } from './map-cell'
import { MD_QUERY, useMediaQuery } from './use-media-query'
import type { BecomingMapDay, Habit, Identity, MoodLevel } from '@/types'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const MOOD_META: Record<MoodLevel, { label: string; dot: string }> = {
  light: { label: 'Light', dot: 'bg-emerald-400' },
  balanced: { label: 'Balanced', dot: 'bg-violet-400' },
  effortful: { label: 'Effortful', dot: 'bg-amber-400' },
  hard: { label: 'Hard', dot: 'bg-rose-400' },
}

const IRREGULAR_PAST_TENSE: Record<string, string> = {
  run: 'Ran',
  read: 'Read',
  drink: 'Drank',
  write: 'Wrote',
  sleep: 'Slept',
  eat: 'Ate',
  swim: 'Swam',
  sing: 'Sang',
  sit: 'Sat',
}

/**
 * Only single-word habit names get past-tensed ("Meditate" → "Meditated").
 * Multi-word names are usually noun phrases ("Morning Walk") where naive
 * conjugation reads as nonsense, so they are left alone.
 */
function actionLabel(name: string): string {
  if (name.includes(' ')) return name
  const lower = name.toLowerCase()
  const irregular = IRREGULAR_PAST_TENSE[lower]
  if (irregular) return irregular
  if (lower.endsWith('ed')) return name
  if (lower.endsWith('e')) return `${name}d`
  if (/[^aeiou]y$/.test(lower)) return `${name.slice(0, -1)}ied`
  return `${name}ed`
}

/**
 * The map only records *which* habits were completed, so the day's value is
 * shown as the habit's target rather than a stored actual.
 */
function habitValueLabel(habit: Habit): string {
  switch (habit.type) {
    case 'binary':
      return 'Done'
    case 'duration':
      return formatDuration(habit.currentTarget)
    case 'count':
      return `${habit.currentTarget}×`
    case 'reduction':
      return `under ${habit.currentTarget} ${habit.unit ?? ''}`.trim()
    case 'quantity':
    default:
      return `${habit.currentTarget} ${habit.unit ?? ''}`.trim()
  }
}

function looksLikeMorningMovement(habit: Habit): boolean {
  const reminder = habit.schedule.reminderTime
  const isMorning = reminder !== undefined && reminder < '10:00'
  return isMorning && /walk|run|move|stretch|gym|yoga|ride/i.test(habit.name)
}

function buildCompanionNote(day: BecomingMapDay, completedHabits: Habit[]): string {
  if (day.milestoneCount > 0) {
    return 'Days like this one are worth remembering. Something moved here.'
  }
  if (day.intensity >= 3) {
    if (completedHabits.some(looksLikeMorningMovement)) {
      return 'Your strongest days this month often include morning movement.'
    }
    return 'This is what a full day looks like for you right now.'
  }
  if (day.intensity === 0) {
    return "A blank square is still part of the pattern. You've come back after days like this before."
  }
  return 'Small days hold the shape of the bigger ones. This one still counts.'
}

/**
 * Snippets are a hard character slice of the full reflection, so they often stop
 * mid-word. An ellipsis makes that read as "there's more" instead of a typo.
 */
function quoteSnippet(snippet: string): string {
  const trimmed = snippet.trimEnd()
  return /[.!?…"']$/.test(trimmed) ? trimmed : `${trimmed}…`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

interface MapDayDrawerProps {
  day: BecomingMapDay | null
  habits: Habit[]
  identities: Identity[]
  onClose: () => void
}

export function MapDayDrawer({ day, habits, identities, onClose }: MapDayDrawerProps) {
  const isOpen = day !== null
  const isDesktop = useMediaQuery(MD_QUERY)
  const reduceMotion = useMotionPreference()
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Keep the last day around so its content survives the exit animation.
  const [renderedDay, setRenderedDay] = React.useState(day)
  if (day !== null && day !== renderedDay) setRenderedDay(day)

  // Move focus in on open, restore it on close, and stop the page behind the
  // sheet from scrolling while it is up.
  React.useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [isOpen])

  // Escape closes; Tab cycles inside the panel.
  React.useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (!panel.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const habitById = React.useMemo(() => new Map(habits.map(habit => [habit.id, habit])), [habits])
  const identityById = React.useMemo(
    () => new Map(identities.map(identity => [identity.id, identity])),
    [identities]
  )

  const completedHabits = React.useMemo(
    () =>
      (renderedDay?.completedHabitIds ?? [])
        .map(id => habitById.get(id))
        .filter((habit): habit is Habit => habit !== undefined),
    [renderedDay, habitById]
  )

  const dayIdentities = React.useMemo(
    () =>
      (renderedDay?.identityIds ?? [])
        .map(id => identityById.get(id))
        .filter((identity): identity is Identity => identity !== undefined),
    [renderedDay, identityById]
  )

  // Reduced motion keeps the panel in place and just fades it in.
  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : isDesktop
      ? {
          // `y: '-50%'` does the vertical centring, because framer-motion owns
          // the inline transform and would overwrite a Tailwind translate class.
          initial: { opacity: 0, x: 20, y: '-50%' },
          animate: { opacity: 1, x: 0, y: '-50%' },
          exit: { opacity: 0, x: 20, y: '-50%' },
        }
      : { initial: { opacity: 0, y: '100%' }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: '100%' } }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="map-day-backdrop"
            // Above the floating nav (z-50) so the sheet isn't clipped by it on
            // mobile and the nav can't be tapped through the backdrop.
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && renderedDay && (
          <motion.div
            key="map-day-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-day-title"
            tabIndex={-1}
            {...panelMotion}
            transition={
              reduceMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 320, damping: 34 }
            }
            className={cn(
              'fixed z-[70] flex flex-col overflow-hidden border border-border bg-card shadow-2xl focus:outline-none',
              'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[32px]',
              'md:inset-x-auto md:bottom-auto md:right-4 md:top-1/2 md:w-96 md:max-h-[80dvh] md:rounded-3xl'
            )}
          >
            {/* Drag handle affordance — mobile sheets read as grabbable. */}
            <div aria-hidden="true" className="flex justify-center pt-3 md:hidden">
              <div className="h-1.5 w-10 rounded-full bg-border" />
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close day details"
              className={cn(
                'absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full',
                'text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
              )}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-8 pt-5">
              <header className="pr-10">
                <h2 id="map-day-title" className="text-2xl font-semibold tracking-tight">
                  {formatMapDate(renderedDay.date)}
                </h2>
                {renderedDay.summary && (
                  <p className="mt-1 text-sm text-muted-foreground">{renderedDay.summary}</p>
                )}
              </header>

              {dayIdentities.length > 0 && (
                <Section title="Supported today">
                  <div className="flex flex-wrap gap-2">
                    {dayIdentities.map(identity => {
                      const accent = getAccentColors(identity.accent)
                      return (
                        <span
                          key={identity.id}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                            accent.soft,
                            accent.text,
                            accent.border
                          )}
                        >
                          <span aria-hidden="true">{identity.icon}</span>
                          {identity.name}
                        </span>
                      )
                    })}
                  </div>
                </Section>
              )}

              {completedHabits.length > 0 ? (
                <Section title="Actions">
                  <ul className="space-y-1.5">
                    {completedHabits.map(habit => (
                      <li key={habit.id} className="text-sm">
                        <span className="font-medium">{actionLabel(habit.name)}</span>
                        <span className="text-muted-foreground"> · {habitValueLabel(habit)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing recorded on this day. Rest is part of the rhythm.
                </p>
              )}

              {renderedDay.mood && (
                <Section title="Mood">
                  <p className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden="true"
                      className={cn('h-2 w-2 shrink-0 rounded-full', MOOD_META[renderedDay.mood].dot)}
                    />
                    {MOOD_META[renderedDay.mood].label}
                  </p>
                </Section>
              )}

              {renderedDay.reflectionSnippet && (
                <Section title="Reflection">
                  <blockquote className="text-sm italic leading-relaxed text-muted-foreground">
                    &ldquo;{quoteSnippet(renderedDay.reflectionSnippet)}&rdquo;
                  </blockquote>
                </Section>
              )}

              {renderedDay.milestoneCount > 0 && (
                <Section title="Milestone">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-100">
                    {renderedDay.milestoneCount === 1
                      ? 'You reached a milestone on this day.'
                      : `You reached ${renderedDay.milestoneCount} milestones on this day.`}
                  </div>
                </Section>
              )}

              <Section title="Companion note">
                <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-sm leading-relaxed text-violet-900 dark:border-violet-900/50 dark:bg-violet-950/25 dark:text-violet-100">
                  {buildCompanionNote(renderedDay, completedHabits)}
                </div>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
