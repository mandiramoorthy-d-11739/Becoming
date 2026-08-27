'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

interface DailyProgressArcProps {
  completed: number
  total: number
  className?: string
}

const SIZE = 140
const STROKE = 10

export function DailyProgressArc({ completed, total, className }: DailyProgressArcProps) {
  const { reducedMotion } = useAppStore()
  const rawId = useId()
  const gradientId = `arc-gradient-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`

  const radius = (SIZE - STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? Math.min(Math.max(completed / total, 0), 1) : 0
  const targetOffset = circumference * (1 - ratio)
  const center = SIZE / 2

  const stepWord = total === 1 ? 'step' : 'steps'
  const ariaLabel =
    total > 0
      ? `${completed} of ${total} meaningful ${stepWord} completed today.`
      : 'Nothing scheduled today.'

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-violet-100 dark:text-violet-950/60"
        />

        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reducedMotion ? targetOffset : circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: reducedMotion ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-4xl font-semibold tabular-nums leading-none tracking-tight">{completed}</span>
        <span className="px-6 text-center text-xs leading-snug text-muted-foreground">
          of {total} meaningful {stepWord}
        </span>
      </div>
    </div>
  )
}
