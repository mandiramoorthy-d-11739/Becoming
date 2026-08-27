'use client'

import * as React from 'react'
import { cn, formatShortDate } from '@/lib/utils'
import { MapCell, parseMapDate } from './map-cell'
import { MD_QUERY, useMediaQuery } from './use-media-query'
import type { BecomingMapDay } from '@/types'

const CELL_SIZE_SM = 11
const CELL_SIZE_MD = 13
const DAYS_PER_WEEK = 7
/** Index 0 = Sunday. Only Mon/Wed/Fri are labelled, like GitHub's graph. */
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const
/** Stops month labels from colliding when a short month starts mid-grid. */
const MIN_WEEKS_BETWEEN_MONTH_LABELS = 3

interface MapWeek {
  key: string
  /** Always 7 entries; `null` pads the partial weeks at either end. */
  cells: Array<BecomingMapDay | null>
  monthLabel?: string
}

/**
 * Groups days into column-major weeks aligned to the weekday they fall on, so
 * every row of the grid is a single weekday.
 */
function buildWeeks(days: BecomingMapDay[]): MapWeek[] {
  if (days.length === 0) return []

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const leadingBlanks = parseMapDate(sorted[0].date).getDay()
  const cells: Array<BecomingMapDay | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...sorted,
  ]
  while (cells.length % DAYS_PER_WEEK !== 0) cells.push(null)

  const weeks: MapWeek[] = []
  const monthStarts: Array<{ index: number; label: string }> = []
  let lastMonth = Number.NaN

  for (let i = 0; i < cells.length; i += DAYS_PER_WEEK) {
    const chunk = cells.slice(i, i + DAYS_PER_WEEK)
    const index = weeks.length
    const firstDay = chunk.find((cell): cell is BecomingMapDay => cell !== null)

    if (firstDay) {
      const date = parseMapDate(firstDay.date)
      const month = date.getFullYear() * 12 + date.getMonth()
      if (month !== lastMonth) {
        monthStarts.push({ index, label: date.toLocaleDateString('en-US', { month: 'short' }) })
        lastMonth = month
      }
    }

    weeks.push({ key: firstDay?.date ?? `week-${index}`, cells: chunk })
  }

  // Thin out labels that would overlap. A range usually opens mid-month, so a
  // crowded *leading* sliver gives way to the first month that has real width —
  // otherwise the grid shows "May, Jul, Aug" and June looks like it vanished.
  let lastLabelledWeek = Number.NEGATIVE_INFINITY
  for (let i = 0; i < monthStarts.length; i++) {
    const { index, label } = monthStarts[i]
    if (index - lastLabelledWeek < MIN_WEEKS_BETWEEN_MONTH_LABELS) continue
    const next = monthStarts[i + 1]
    const crowdedByNext = next !== undefined && next.index - index < MIN_WEEKS_BETWEEN_MONTH_LABELS
    if (i === 0 && crowdedByNext) continue
    weeks[index].monthLabel = label
    lastLabelledWeek = index
  }

  return weeks
}

function useCellSize(): number {
  return useMediaQuery(MD_QUERY) ? CELL_SIZE_MD : CELL_SIZE_SM
}

/** Column of Mon/Wed/Fri labels, offset to clear the month-label row. */
function WeekdayLabels({ size }: { size: number }) {
  return (
    <div className="mt-4 flex shrink-0 flex-col gap-[3px]" aria-hidden="true">
      {WEEKDAY_LABELS.map((label, index) => (
        <div
          key={index}
          style={{ height: size }}
          className="flex items-center text-[10px] leading-none text-muted-foreground"
        >
          {label}
        </div>
      ))}
    </div>
  )
}

export interface BecomingMapProps {
  days: BecomingMapDay[]
  onSelectDay?: (date: string) => void
  selectedDate?: string | null
  className?: string
}

export function BecomingMap({ days, onSelectDay, selectedDate, className }: BecomingMapProps) {
  const size = useCellSize()
  const weeks = React.useMemo(() => buildWeeks(days), [days])
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // The most recent days live on the right, so start the view there.
  React.useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollLeft = element.scrollWidth
  }, [weeks, size])

  const gridLabel = React.useMemo(() => {
    if (days.length === 0) return 'Becoming map'
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
    const first = formatShortDate(parseMapDate(sorted[0].date))
    const last = formatShortDate(parseMapDate(sorted[sorted.length - 1].date))
    return `Becoming map, ${first} to ${last}. Each square is one day.`
  }, [days])

  if (weeks.length === 0) return null

  return (
    <div className={cn('flex gap-2', className)}>
      <WeekdayLabels size={size} />

      <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto pb-1">
        <div className="inline-block">
          {/* Month labels sit above the column their month begins in. */}
          <div className="flex h-4 gap-[3px]" aria-hidden="true">
            {weeks.map(week => (
              <div key={week.key} className="relative shrink-0" style={{ width: size }}>
                {week.monthLabel && (
                  <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] leading-none text-muted-foreground">
                    {week.monthLabel}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Cells stay real buttons so they are reachable and activatable by
              keyboard; each one carries its own full description. */}
          <div role="grid" aria-label={gridLabel} className="flex gap-[3px]">
            {weeks.map(week => (
              <div key={week.key} role="row" className="flex flex-col gap-[3px]">
                {week.cells.map((cell, index) =>
                  cell ? (
                    <MapCell
                      key={cell.date}
                      day={cell}
                      size={size}
                      onClick={onSelectDay}
                      isSelected={cell.date === selectedDate}
                    />
                  ) : (
                    <div
                      key={`${week.key}-blank-${index}`}
                      aria-hidden="true"
                      className="shrink-0"
                      style={{ width: size, height: size }}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface BecomingMapSkeletonProps {
  /** Number of days the real grid will hold, so the geometry never shifts. */
  dayCount?: number
  className?: string
}

export function BecomingMapSkeleton({ dayCount = 90, className }: BecomingMapSkeletonProps) {
  const size = useCellSize()
  // Worst case the range starts on a Saturday, so allow for six leading blanks.
  const weekCount = Math.ceil((dayCount + DAYS_PER_WEEK - 1) / DAYS_PER_WEEK)

  return (
    <div className={cn('flex gap-2', className)} role="status" aria-label="Loading your map">
      <WeekdayLabels size={size} />

      <div className="min-w-0 flex-1 overflow-hidden pb-1">
        <div className="inline-block">
          <div className="h-4" />
          <div className="flex gap-[3px]" aria-hidden="true">
            {Array.from({ length: weekCount }, (_, week) => (
              <div key={week} className="flex flex-col gap-[3px]">
                {Array.from({ length: DAYS_PER_WEEK }, (_, day) => (
                  <div
                    key={day}
                    style={{ width: size, height: size }}
                    className="shrink-0 animate-pulse rounded-[4px] bg-secondary/70 dark:bg-white/5"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
