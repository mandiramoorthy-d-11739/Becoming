'use client'
import { FloatingNav } from '@/components/navigation/floating-nav'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  showNav?: boolean
  className?: string
}

export function AppShell({ children, showNav = true, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={cn('pb-28 md:pb-8 md:pl-20 lg:pl-24', className)}>
        {children}
      </main>
      {showNav && <FloatingNav />}
    </div>
  )
}
