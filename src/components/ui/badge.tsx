import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full text-xs font-medium px-2.5 py-0.5 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
        green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
        rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        outline: 'border border-border',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
