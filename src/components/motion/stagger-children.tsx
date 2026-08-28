'use client'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@/lib/animations'
import { useAppStore } from '@/store/app-store'

interface StaggerChildrenProps {
  children: React.ReactNode
  className?: string
}

export function StaggerChildren({ children, className }: StaggerChildrenProps) {
  const { reducedMotion } = useAppStore()
  if (reducedMotion) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const { reducedMotion } = useAppStore()
  if (reducedMotion) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  )
}
