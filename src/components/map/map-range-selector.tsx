'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { MAP_RANGE_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { MapRange } from '@/types'

interface MapRangeSelectorProps {
  value: MapRange
  onChange: (value: MapRange) => void
  className?: string
}

export function MapRangeSelector({ value, onChange, className }: MapRangeSelectorProps) {
  const buttonsRef = React.useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = Math.max(
    0,
    MAP_RANGE_OPTIONS.findIndex(option => option.value === value)
  )

  // Roving tabindex: one stop in the tab order, arrow keys move between ranges.
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const last = MAP_RANGE_OPTIONS.length - 1
      let next: number
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = activeIndex === last ? 0 : activeIndex + 1
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          next = activeIndex === 0 ? last : activeIndex - 1
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = last
          break
        default:
          return
      }
      event.preventDefault()
      onChange(MAP_RANGE_OPTIONS[next].value)
      buttonsRef.current[next]?.focus()
    },
    [activeIndex, onChange]
  )

  return (
    <div
      role="tablist"
      aria-label="Map time range"
      onKeyDown={handleKeyDown}
      className={cn('inline-flex items-center rounded-full bg-secondary p-1', className)}
    >
      {MAP_RANGE_OPTIONS.map((option, index) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            ref={node => {
              buttonsRef.current[index] = node
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
              'focus-visible:ring-offset-1 focus-visible:ring-offset-background',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.span
                aria-hidden="true"
                layoutId="map-range-indicator"
                className="absolute inset-0 rounded-full bg-card shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
