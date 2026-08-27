'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sun, Map, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/today', icon: Sun, label: 'Today' },
  { href: '/map', icon: Map, label: 'Map' },
  { href: '/companion', icon: MessageCircle, label: 'Companion' },
  { href: '/you', icon: User, label: 'You' },
]

export function FloatingNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-4 mb-4">
          <div className="flex items-center justify-around bg-card/90 backdrop-blur-xl border border-border rounded-3xl px-2 py-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)]">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors min-w-[64px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                    isActive ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-violet-50 dark:bg-violet-950/40 rounded-2xl"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5" strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className="relative text-[10px] font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Desktop side nav */}
      <nav
        className="fixed left-3 top-1/2 -translate-y-1/2 z-50 hidden md:flex"
        aria-label="Main navigation"
      >
        <div className="flex flex-col items-center gap-1 bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
          <div className="w-8 h-8 rounded-2xl bg-violet-600 flex items-center justify-center mb-2">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div className="w-px h-4 bg-border" />
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'relative flex items-center justify-center w-11 h-11 rounded-2xl transition-colors group',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator-desktop"
                    className="absolute inset-0 bg-violet-50 dark:bg-violet-950/40 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative h-5 w-5" strokeWidth={isActive ? 2.5 : 1.75} />
                <span className="absolute left-full ml-2 px-2 py-1 rounded-xl bg-card border border-border text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
