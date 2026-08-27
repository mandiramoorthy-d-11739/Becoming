'use client'

import { cn, formatShortDate } from '@/lib/utils'
import type { BecomingMapDay, IdentityAccent, MapIntensity } from '@/types'

type IntensityScale = readonly [string, string, string, string, string]

/**
 * Written out per accent so Tailwind can statically detect every class.
 * Index = MapIntensity (0 = nothing recorded, 4 = fullest day).
 */
const INTENSITY_CLASSES: Record<IdentityAccent, IntensityScale> = {
  violet: ['bg-secondary', 'bg-violet-500/20', 'bg-violet-500/40', 'bg-violet-500/65', 'bg-violet-500'],
  indigo: ['bg-secondary', 'bg-indigo-500/20', 'bg-indigo-500/40', 'bg-indigo-500/65', 'bg-indigo-500'],
  green: ['bg-secondary', 'bg-emerald-500/20', 'bg-emerald-500/40', 'bg-emerald-500/65', 'bg-emerald-500'],
  teal: ['bg-secondary', 'bg-teal-500/20', 'bg-teal-500/40', 'bg-teal-500/65', 'bg-teal-500'],
  blue: ['bg-secondary', 'bg-blue-500/20', 'bg-blue-500/40', 'bg-blue-500/65', 'bg-blue-500'],
  rose: ['bg-secondary', 'bg-rose-500/20', 'bg-rose-500/40', 'bg-rose-500/65', 'bg-rose-500'],
  amber: ['bg-secondary', 'bg-amber-500/20', 'bg-amber-500/40', 'bg-amber-500/65', 'bg-amber-500'],
  orange: ['bg-secondary', 'bg-orange-500/20', 'bg-orange-500/40', 'bg-orange-500/65', 'bg-orange-500'],
}

export function getIntensityClass(accent: IdentityAccent, intensity: MapIntensity): string {
  return INTENSITY_CLASSES[accent][intensity]
}

interface IdentityMiniMapProps {
  days: BecomingMapDay[]
  accent: IdentityAccent
  count?: number
  className?: string
}

export function IdentityMiniMap({ days, accent, count = 30, className }: IdentityMiniMapProps) {
  const recent = days.slice(-count)
  const leadingBlanks = Math.max(0, count - recent.length)
  const cells: Array<BecomingMapDay | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...recent,
  ]

  const first = recent[0]
  const last = recent[recent.length - 1]
  const label = first && last
    ? `Activity from ${formatShortDate(first.date)} to ${formatShortDate(last.date)}`
    : `Activity over the last ${count} days`

  return (
    <div className={cn('flex gap-[2px]', className)} role="img" aria-label={label}>
      {cells.map((day, i) => (
        <span
          key={day?.date ?? `blank-${i}`}
          aria-hidden="true"
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-[2px]',
            day ? INTENSITY_CLASSES[accent][day.intensity] : 'bg-secondary/50'
          )}
        />
      ))}
    </div>
  )
}
