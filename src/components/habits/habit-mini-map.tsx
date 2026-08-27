'use client'

import { useMemo } from 'react'
import { cn, formatDate, subDays, toDateString } from '@/lib/utils'
import type { HabitCheckin } from '@/types'

type CellState = 'complete' | 'partial' | 'skipped' | 'none'

const CELL_CLASSES: Record<CellState, string> = {
  complete: 'bg-violet-500',
  partial: 'bg-violet-300 dark:bg-violet-400/70',
  skipped: 'bg-secondary',
  none: 'bg-secondary/50',
}

const CELL_LABEL: Record<CellState, string> = {
  complete: 'completed',
  partial: 'partly done',
  skipped: 'skipped on purpose',
  none: 'nothing recorded',
}

const WEEKDAYS: ReadonlyArray<{ short: string; long: string }> = [
  { short: 'S', long: 'Sunday' },
  { short: 'M', long: 'Monday' },
  { short: 'T', long: 'Tuesday' },
  { short: 'W', long: 'Wednesday' },
  { short: 'T', long: 'Thursday' },
  { short: 'F', long: 'Friday' },
  { short: 'S', long: 'Saturday' },
]

const LEGEND: ReadonlyArray<{ state: CellState; label: string }> = [
  { state: 'complete', label: 'Done' },
  { state: 'partial', label: 'Partly' },
  { state: 'skipped', label: 'Skipped' },
  { state: 'none', label: 'Nothing recorded' },
]

/** Date-only strings parse as UTC by default; this keeps them on the local day. */
function localDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

interface HabitMiniMapProps {
  checkins: HabitCheckin[]
  days?: number
  className?: string
}

export function HabitMiniMap({ checkins, days = 35, className }: HabitMiniMapProps) {
  const cells = useMemo(() => {
    const byDate = new Map(checkins.map(checkin => [checkin.date, checkin]))
    const today = new Date()

    return Array.from({ length: days }, (_, index) => {
      const date = toDateString(subDays(today, days - 1 - index))
      const status = byDate.get(date)?.status
      const state: CellState =
        status === 'complete' || status === 'partial' || status === 'skipped' ? status : 'none'
      return { date, state }
    })
  }, [checkins, days])

  // Pad the front so the first column always lands on a Sunday.
  const leadingBlanks = cells.length > 0 ? localDate(cells[0].date).getDay() : 0

  const completedCount = cells.filter(cell => cell.state === 'complete').length

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="group"
        aria-label={`Last ${days} days: ${completedCount} completed`}
        className="space-y-1.5"
      >
        <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
          {WEEKDAYS.map((weekday, index) => (
            <span
              key={`${weekday.long}-${index}`}
              className="text-center text-[10px] font-medium text-muted-foreground"
            >
              {weekday.short}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <span key={`blank-${index}`} className="aspect-square" aria-hidden="true" />
          ))}

          {cells.map(cell => (
            <span
              key={cell.date}
              role="img"
              aria-label={`${formatDate(localDate(cell.date), {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}: ${CELL_LABEL[cell.state]}`}
              className={cn(
                'relative aspect-square w-full overflow-hidden rounded-md',
                CELL_CLASSES[cell.state]
              )}
            >
              {cell.state === 'skipped' && (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-muted-foreground/40"
                />
              )}
            </span>
          ))}
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {LEGEND.map(item => (
          <li key={item.state} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              aria-hidden="true"
              className={cn('h-2.5 w-2.5 rounded-[3px]', CELL_CLASSES[item.state])}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
