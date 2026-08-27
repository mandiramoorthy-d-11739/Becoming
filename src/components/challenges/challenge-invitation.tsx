'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PersonalChallenge } from '@/types'

interface ChallengeInvitationProps {
  challenge: PersonalChallenge
  /** Called when the invitation is set aside. The card removes itself either way. */
  onDismiss?: () => void
  className?: string
}

export function ChallengeInvitation({ challenge, onDismiss, className }: ChallengeInvitationProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <section
      aria-labelledby={`challenge-${challenge.id}-title`}
      className={cn(
        'rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-transparent p-5',
        'dark:border-amber-900/40 dark:from-amber-950/20',
        className
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700/90 dark:text-amber-500/90">
        A personal challenge
      </p>

      <h2 id={`challenge-${challenge.id}-title`} className="mt-2 font-medium leading-snug text-balance">
        {challenge.title}
      </h2>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{challenge.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="soft" size="sm">
          <Link href={`/challenges/${challenge.id}`}>Try the challenge</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            setDismissed(true)
            onDismiss?.()
          }}
        >
          Maybe another day
        </Button>
      </div>
    </section>
  )
}
