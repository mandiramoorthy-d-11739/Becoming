'use client'
import { motion } from 'framer-motion'
import { CompanionOrb } from './companion-orb'
import { SafetySupportCard } from './safety-support-card'
import { useMotionPreference } from '@/components/onboarding/use-motion-preference'
import { CompanionStyle, Message } from '@/types'

interface CompanionMessageProps {
  message: Message
  /** Drives the orb colour so it matches the currently selected companion style. */
  style?: CompanionStyle
}

export function CompanionMessage({ message, style = 'warm_friend' }: CompanionMessageProps) {
  const reduceMotion = useMotionPreference()
  const isCrisis = message.safetyState === 'crisis'

  return (
    <motion.div
      className="flex items-start gap-3"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      <CompanionOrb style={style} size="sm" animate={false} className="mt-0.5 shrink-0" />

      {isCrisis ? (
        <div className="min-w-0 flex-1">
          <SafetySupportCard content={message.content} />
        </div>
      ) : (
        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-tl-lg bg-secondary px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
      )}
    </motion.div>
  )
}
