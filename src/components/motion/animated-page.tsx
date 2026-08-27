'use client'
import { motion } from 'framer-motion'
import { pageTransition } from '@/lib/animations'
import { useAppStore } from '@/store/app-store'

export function AnimatedPage({ children }: { children: React.ReactNode }) {
  const { reducedMotion } = useAppStore()
  if (reducedMotion) return <>{children}</>
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  )
}
