import { Variants } from 'framer-motion'

export const springConfig = { stiffness: 260, damping: 24, mass: 0.8 }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { ...springConfig } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { ...springConfig } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { ...springConfig } },
}

export const checkAnimation: Variants = {
  unchecked: { scale: 1, backgroundColor: 'transparent' },
  checked: { scale: [1, 1.12, 1], transition: { duration: 0.3, times: [0, 0.5, 1] } },
}

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
}
