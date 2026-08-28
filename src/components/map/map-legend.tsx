'use client'

import { cn } from '@/lib/utils'
import { MAP_INTENSITY_CLASSES } from './map-cell'
import type { MapIntensity } from '@/types'

const LEVELS: MapIntensity[] = [0, 1, 2, 3, 4]

interface MapLegendProps {
  className?: string
}

export function MapLegend({ className }: MapLegendProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Less</span>
        <span
          role="img"
          aria-label="Shading runs from a quiet day through to a full day"
          className="flex items-center gap-[3px]"
        >
          {LEVELS.map(level => (
            <span
              key={level}
              aria-hidden="true"
              className={cn('h-[11px] w-[11px] rounded-[4px]', MAP_INTENSITY_CLASSES[level])}
            />
          ))}
        </span>
        <span>More</span>
      </div>
      <p className="text-xs text-muted-foreground">
        A small white dot marks a day you reached a milestone.
      </p>
    </div>
  )
}
