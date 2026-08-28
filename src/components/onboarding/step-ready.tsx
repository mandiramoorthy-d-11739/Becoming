'use client'

import { motion } from 'framer-motion'

interface SummaryRow {
  label: string
  value: string
}

interface StepReadyProps {
  identityNames: string[]
  firstHabitSummary: string | null
  companionLabel: string
  reduceMotion: boolean
}

export function StepReady({
  identityNames,
  firstHabitSummary,
  companionLabel,
  reduceMotion,
}: StepReadyProps) {
  const rows: SummaryRow[] = [
    {
      label: 'Identity',
      value:
        identityNames.length > 0
          ? identityNames.join(' · ')
          : 'Yours to name, whenever you are ready.',
    },
    {
      label: 'First habit',
      value: firstHabitSummary ?? 'You can add your first one from Today.',
    },
    { label: 'Companion', value: companionLabel },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.7,
            delay: reduceMotion ? 0 : 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 shadow-[0_16px_50px_-12px_rgba(109,40,217,0.6)]"
        />
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Your Becoming begins here.
        </h1>
      </div>

      <dl className="space-y-4 rounded-3xl border border-border bg-card p-6">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <dt className="text-xs font-medium text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium leading-relaxed text-balance">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
