'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useOnboardingStore } from '@/store/onboarding-store'
import { useMotionPreference } from '@/components/onboarding/use-motion-preference'

const SPLASH_DURATION_MS = 1400

export default function SplashPage() {
  const router = useRouter()
  const reduceMotion = useMotionPreference()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Read on the way out, so a late rehydration of the persisted store still
      // routes the user to the right place.
      const { completed } = useOnboardingStore.getState()
      router.push(completed ? '/today' : '/onboarding')
    }, SPLASH_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [router])

  const duration = reduceMotion ? 0 : undefined

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6">
      <motion.div
        aria-hidden="true"
        className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 shadow-[0_12px_40px_-12px_rgba(109,40,217,0.55)]"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: duration ?? 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="flex flex-col items-center gap-2 text-center">
        <motion.h1
          className="text-5xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration ?? 0.5, delay: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          Becoming
        </motion.h1>

        <motion.p
          className="text-base text-muted-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration ?? 0.5, delay: reduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Become who you want to be.
        </motion.p>
      </div>
    </main>
  )
}
