'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { BecomingMapDay, MapIntensity } from '@/types'

/**
 * Parses a `YYYY-MM-DD` string in the *local* timezone.
 *
 * `new Date('2026-03-14')` is parsed as UTC midnight, which lands on the
 * previous calendar day anywhere west of Greenwich — enough to push a cell into
 * the wrong weekday column and mislabel it.
 */
export function parseMapDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** "March 14" */
export function formatMapDate(date: string): string {
  return parseMapDate(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

/**
 * Written out in full so Tailwind can statically detect every class.
 * Index = MapIntensity (0 = nothing recorded, 4 = a full day).
 */
export const MAP_INTENSITY_CLASSES: Record<MapIntensity, string> = {
  0: 'bg-secondary/70 dark:bg-white/5',
  1: 'bg-violet-200 dark:bg-violet-900/50',
  2: 'bg-violet-300 dark:bg-violet-700/70',
  3: 'bg-violet-500 dark:bg-violet-500',
  4: 'bg-violet-600 ring-2 ring-violet-300 dark:bg-violet-400',
}

/** Colour is never the only signal — every cell says this out loud too. */
const INTENSITY_DESCRIPTION: Record<MapIntensity, string> = {
  0: 'a quiet day',
  1: 'light activity',
  2: 'some activity',
  3: 'moderate activity',
  4: 'a full day',
}

/** e.g. "March 14: 3 habits completed, moderate activity" */
export function describeMapDay(day: BecomingMapDay): string {
  // The API zeroes `intensity` for days outside the active identity filter
  // while leaving `completedHabitIds` intact, so describe what is actually
  // drawn rather than the raw habit list.
  const count = day.intensity === 0 ? 0 : day.completedHabitIds.length
  const habits = count === 1 ? '1 habit completed' : `${count} habits completed`
  const parts = [`${formatMapDate(day.date)}: ${habits}`, INTENSITY_DESCRIPTION[day.intensity]]
  if (day.milestoneCount > 0) parts.push('milestone day')
  return parts.join(', ')
}

export interface MapCellProps {
  day: BecomingMapDay
  /** Edge length in px. */
  size?: number
  /** Receives the day's date so the handler can stay referentially stable. */
  onClick?: (date: string) => void
  isSelected?: boolean
}

function MapCellComponent({ day, size = 13, onClick, isSelected = false }: MapCellProps) {
  const { date } = day
  const handleClick = React.useCallback(() => onClick?.(date), [onClick, date])
  const label = describeMapDay(day)

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      aria-pressed={isSelected}
      style={{ width: size, height: size }}
      className={cn(
        // `relative` + a hover z-index keeps the scaled cell above its neighbours.
        'relative shrink-0 rounded-[4px] transition-transform duration-150 ease-out',
        'hover:z-10 hover:scale-125',
        'focus-visible:z-10 focus-visible:scale-125 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        MAP_INTENSITY_CLASSES[day.intensity],
        // Listed last so tailwind-merge drops the milestone ring in favour of
        // the selection ring when a milestone day is the selected one.
        isSelected && 'z-10 ring-2 ring-foreground ring-offset-1 ring-offset-background'
      )}
    >
      {day.milestoneCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        />
      )}
    </button>
  )
}

/** 365 of these render at once — memoised so a selection change repaints two. */
export const MapCell = React.memo(MapCellComponent)
MapCell.displayName = 'MapCell'
