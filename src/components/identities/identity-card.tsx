'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { IdentityMiniMap } from '@/components/identities/identity-mini-map'
import { cn, getAccentColors } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { BecomingMapDay, Identity, IdentityAccent } from '@/types'

/** Static strings so Tailwind keeps the hover borders in the build. */
const HOVER_BORDER: Record<IdentityAccent, string> = {
  violet: 'group-hover:border-violet-300 dark:group-hover:border-violet-700',
  indigo: 'group-hover:border-indigo-300 dark:group-hover:border-indigo-700',
  green: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700',
  teal: 'group-hover:border-teal-300 dark:group-hover:border-teal-700',
  blue: 'group-hover:border-blue-300 dark:group-hover:border-blue-700',
  rose: 'group-hover:border-rose-300 dark:group-hover:border-rose-700',
  amber: 'group-hover:border-amber-300 dark:group-hover:border-amber-700',
  orange: 'group-hover:border-orange-300 dark:group-hover:border-orange-700',
}

interface IdentityCardProps {
  identity: Identity
  habitCount: number
  activeDays: number
  recentNote?: string
  miniMapDays?: BecomingMapDay[]
  className?: string
}

export function IdentityCard({
  identity,
  habitCount,
  activeDays,
  recentNote,
  miniMapDays = [],
  className,
}: IdentityCardProps) {
  const { reducedMotion } = useAppStore()
  const accent = getAccentColors(identity.accent)

  const body = (
    <>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl',
            accent.soft
          )}
          aria-hidden="true"
        >
          {identity.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium leading-tight">{identity.name}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{identity.description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-muted-foreground">
          {habitCount} connected {habitCount === 1 ? 'habit' : 'habits'}
        </p>
        <p className="text-xs text-muted-foreground">
          {activeDays} active {activeDays === 1 ? 'day' : 'days'}
        </p>
      </div>

      {recentNote && (
        <p className="mt-3 line-clamp-2 text-xs italic leading-relaxed text-muted-foreground">
          &ldquo;{recentNote}&rdquo;
        </p>
      )}

      <IdentityMiniMap days={miniMapDays} accent={identity.accent} count={30} className="mt-4" />
    </>
  )

  const cardClassName = cn(
    'rounded-3xl border border-border bg-card p-5 transition-all duration-200',
    'group-focus-visible:ring-2 group-focus-visible:ring-violet-500 group-focus-visible:ring-offset-2',
    HOVER_BORDER[identity.accent],
    !reducedMotion && 'group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]',
    className
  )

  return (
    <Link
      href={`/identities/${identity.id}`}
      className="group block focus-visible:outline-none"
      aria-label={`${identity.name} — ${habitCount} connected habits, ${activeDays} active days`}
    >
      {reducedMotion ? (
        <div className={cardClassName}>{body}</div>
      ) : (
        <motion.div layoutId={`identity-${identity.id}`} className={cardClassName}>
          {body}
        </motion.div>
      )}
    </Link>
  )
}
