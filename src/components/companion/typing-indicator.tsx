'use client'
import { motion } from 'framer-motion'
import { CompanionOrb } from './companion-orb'
import { useMotionPreference } from '@/components/onboarding/use-motion-preference'
import { CompanionStyle } from '@/types'

interface TypingIndicatorProps {
  style?: CompanionStyle
}

const DOTS = [0, 1, 2]

export function TypingIndicator({ style = 'warm_friend' }: TypingIndicatorProps) {
  const reduceMotion = useMotionPreference()

  return (
    <div className="flex items-start gap-3" role="status" aria-label="Becoming is thinking">
      <CompanionOrb style={style} size="sm" animate={false} className="mt-0.5 shrink-0" />

      <div className="rounded-3xl rounded-tl-lg bg-secondary px-4 py-3" aria-hidden="true">
        <div className="flex items-center gap-1.5">
          {DOTS.map((i) => (
            <motion.span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-muted-foreground"
              animate={reduceMotion ? { opacity: [0.35, 1, 0.35] } : { y: [0, -4, 0] }}
              transition={{
                duration: reduceMotion ? 1.2 : 0.9,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
