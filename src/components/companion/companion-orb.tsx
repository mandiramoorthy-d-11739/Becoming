'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CompanionStyle } from '@/types'

interface CompanionOrbProps {
  style?: CompanionStyle
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
}

const styleColors: Record<CompanionStyle, string> = {
  warm_friend: 'from-rose-400 to-violet-500',
  calm_coach: 'from-blue-400 to-indigo-600',
  gentle_guide: 'from-teal-400 to-green-500',
  direct_motivator: 'from-amber-400 to-orange-500',
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

export function CompanionOrb({ style = 'warm_friend', size = 'md', animate = true, className }: CompanionOrbProps) {
  return (
    <motion.div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center relative overflow-hidden',
        styleColors[style],
        sizes[size],
        className
      )}
      animate={animate ? {
        boxShadow: [
          '0 0 0 0px rgba(139, 92, 246, 0.3)',
          '0 0 0 8px rgba(139, 92, 246, 0)',
        ],
      } : {}}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
    >
      <div className="absolute inset-0 bg-white/10 rounded-full" />
      <span className="relative text-white font-semibold text-sm select-none">B</span>
    </motion.div>
  )
}
