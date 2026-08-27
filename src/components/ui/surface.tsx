import * as React from 'react'
import { cn } from '@/lib/utils'

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  padded?: boolean
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, elevated = false, padded = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-3xl border border-border bg-card',
        elevated && 'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)]',
        padded && 'p-6',
        className
      )}
      {...props}
    />
  )
)
Surface.displayName = 'Surface'
