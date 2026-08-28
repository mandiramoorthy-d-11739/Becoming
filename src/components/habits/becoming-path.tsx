'use client'

import { useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn, formatDate, formatShortDate } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { Progression, ProgressionSource } from '@/types'

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/** Width of one node column, in px. Fixed so the SVG line can meet each circle. */
const NODE_WIDTH = 104
/** Diameter of a node circle (h-10 / w-10), in px. */
const CIRCLE_SIZE = 40
/** How far the connecting line bows away from the straight run between nodes. */
const CURVE_BOW = 14

/* -------------------------------------------------------------------------- */
/* Copy                                                                        */
/* -------------------------------------------------------------------------- */

const SOURCE_LABEL: Record<ProgressionSource, string> = {
  user: 'You decided this',
  companion: 'Your companion suggested it',
  challenge: 'Came out of a challenge',
}

const FEEDBACK_LABEL: Record<NonNullable<Progression['userFeedback']>, string> = {
  too_much: 'Felt like too much',
  about_right: 'Felt about right',
  surprisingly_easy: 'Surprisingly easy',
}

/* -------------------------------------------------------------------------- */
/* Nodes                                                                       */
/* -------------------------------------------------------------------------- */

type NodeState = 'start' | 'kept' | 'returned' | 'current'

interface PathNode {
  id: string
  /** Number shown inside the circle. */
  value: number
  state: NodeState
  /** Short caption under the date. */
  label: string
  /** Omitted for the opening node, which has no date of its own. */
  dateLabel?: string
  progression?: Progression
}

/** Date-only strings parse as UTC by default; this keeps them on the local day. */
function localDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value)
}

function formatValue(value: number, unit?: string): string {
  if (!unit) return String(value)
  if (unit === 'minutes') return `${value} min`
  return `${value} ${unit}`
}

function buildNodes(progressions: Progression[], currentTarget: number, unit?: string): PathNode[] {
  const ordered = [...progressions].sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  if (ordered.length === 0) {
    return [
      {
        id: 'current',
        value: currentTarget,
        state: 'current',
        label: 'Where you are',
        dateLabel: 'Today',
      },
    ]
  }

  const nodes: PathNode[] = [
    {
      id: 'start',
      value: ordered[0].previousTarget,
      state: 'start',
      label: 'Started here',
    },
  ]

  for (const progression of ordered) {
    const inFlight = progression.outcome === undefined
    const returned = progression.outcome === 'reverted'

    // A returned step still shows the number that was explored — the circle is
    // outlined rather than filled, and the caption says where you landed.
    const value = returned
      ? progression.proposedTarget
      : (progression.acceptedTarget ?? progression.proposedTarget)

    const label = returned
      ? `Came back to ${formatValue(progression.acceptedTarget ?? progression.previousTarget, unit)}`
      : inFlight
        ? 'Trying this now'
        : `Settled at ${formatValue(value, unit)}`

    nodes.push({
      id: progression.id,
      value,
      state: returned ? 'returned' : inFlight ? 'current' : 'kept',
      label,
      dateLabel: formatShortDate(localDate(progression.startedAt)),
      progression,
    })
  }

  const last = nodes[nodes.length - 1]

  if (last.state === 'current') return nodes

  if (last.state === 'kept' && last.value === currentTarget) {
    return [...nodes.slice(0, -1), { ...last, state: 'current', label: 'Where you are now' }]
  }

  return [
    ...nodes,
    {
      id: 'current',
      value: currentTarget,
      state: 'current',
      label: 'Where you are now',
      dateLabel: 'Today',
    },
  ]
}

const CIRCLE_CLASSES: Record<NodeState, string> = {
  start: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  kept: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  returned: 'border border-dashed border-border bg-card text-muted-foreground',
  current: 'bg-violet-600 text-white shadow-sm',
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

interface BecomingPathProps {
  progressions: Progression[]
  currentTarget: number
  unit?: string
  /** Optional note captured during a step, keyed by progression id. */
  notes?: Readonly<Record<string, string>>
  className?: string
}

export function BecomingPath({
  progressions,
  currentTarget,
  unit,
  notes,
  className,
}: BecomingPathProps) {
  // Stripped of punctuation so it is safe inside an SVG `url(#…)` reference.
  const gradientId = `becoming-path-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const detailId = useId()
  const { reducedMotion } = useAppStore()
  const [openNodeId, setOpenNodeId] = useState<string | null>(null)

  const nodes = useMemo(
    () => buildNodes(progressions, currentTarget, unit),
    [progressions, currentTarget, unit]
  )

  const openNode = nodes.find(node => node.id === openNodeId) ?? null

  const width = nodes.length * NODE_WIDTH
  const centerY = CIRCLE_SIZE / 2

  const linePath = useMemo(() => {
    if (nodes.length < 2) return ''
    const x = (index: number) => index * NODE_WIDTH + NODE_WIDTH / 2
    let d = `M ${x(0)} ${centerY}`
    for (let i = 1; i < nodes.length; i++) {
      const controlX = (x(i - 1) + x(i)) / 2
      const controlY = centerY + (i % 2 === 0 ? CURVE_BOW : -CURVE_BOW)
      d += ` Q ${controlX} ${controlY}, ${x(i)} ${centerY}`
    }
    return d
  }, [nodes.length, centerY])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="-mx-5 overflow-x-auto px-5 pb-2">
        <div className="relative" style={{ width }}>
          {linePath && (
            <svg
              width={width}
              height={CIRCLE_SIZE}
              viewBox={`0 0 ${width} ${CIRCLE_SIZE}`}
              className="pointer-events-none absolute left-0 top-0 text-violet-400 dark:text-violet-500"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d={linePath}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          )}

          <ol className="relative flex list-none">
            {nodes.map(node => {
              const isOpen = node.id === openNodeId
              return (
                <li key={node.id} className="shrink-0" style={{ width: NODE_WIDTH }}>
                  <button
                    type="button"
                    onClick={() => setOpenNodeId(isOpen ? null : node.id)}
                    aria-expanded={isOpen}
                    aria-controls={detailId}
                    className={cn(
                      'flex w-full flex-col items-center gap-1.5 rounded-2xl px-1 py-1 text-center transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                      'hover:bg-secondary/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-transform',
                        CIRCLE_CLASSES[node.state],
                        isOpen && 'ring-2 ring-violet-400 ring-offset-2 ring-offset-background'
                      )}
                    >
                      {node.value}
                    </span>

                    {node.state === 'returned' && (
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                        returned
                      </span>
                    )}

                    {node.dateLabel && (
                      <span className="text-[10px] text-muted-foreground">{node.dateLabel}</span>
                    )}
                    <span className="text-[10px] leading-tight text-foreground/80 text-balance">
                      {node.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <div id={detailId} aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {openNode && (
            <motion.div
              key={openNode.id}
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              <NodeDetail node={openNode} unit={unit} note={notes?.[openNode.id]} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {nodes.length === 1 && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your path starts here. Every time your target changes, a step appears — including the
          ones you come back from.
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Detail card                                                                 */
/* -------------------------------------------------------------------------- */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed">{children}</dd>
    </div>
  )
}

function NodeDetail({
  node,
  unit,
  note,
}: {
  node: PathNode
  unit?: string
  note?: string
}) {
  const progression = node.progression

  if (!progression) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="text-sm font-medium">
          {node.state === 'start' ? 'Where the path began' : 'Where you are now'}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {formatValue(node.value, unit)}
          {node.dateLabel ? ` · ${node.dateLabel}` : ''}
        </p>
      </div>
    )
  }

  const landed = progression.acceptedTarget ?? progression.previousTarget

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-base font-medium tabular-nums">
          {formatValue(progression.previousTarget, unit)}
          <span aria-hidden="true" className="mx-2 text-muted-foreground">
            &rarr;
          </span>
          <span className="sr-only">to</span>
          {formatValue(progression.proposedTarget, unit)}
        </p>
        {progression.outcome === 'reverted' && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            Came back to {formatValue(landed, unit)}
          </span>
        )}
      </div>

      <dl className="mt-4 space-y-3">
        <DetailRow label="When">
          {formatDate(localDate(progression.startedAt), {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
          {' · '}
          {progression.experimentDurationDays} day experiment
        </DetailRow>

        <DetailRow label="Why">{progression.reason}</DetailRow>

        <DetailRow label="Where it came from">{SOURCE_LABEL[progression.source]}</DetailRow>

        {progression.userFeedback && (
          <DetailRow label="How it felt">
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
              {FEEDBACK_LABEL[progression.userFeedback]}
            </span>
          </DetailRow>
        )}

        {note && (
          <DetailRow label="Note">
            <span className="italic">&ldquo;{note}&rdquo;</span>
          </DetailRow>
        )}
      </dl>

      {progression.outcome === 'reverted' && (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Coming back isn&rsquo;t losing ground. It&rsquo;s how you found the size that fits.
        </p>
      )}
    </div>
  )
}
