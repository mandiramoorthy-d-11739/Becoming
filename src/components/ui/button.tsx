import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default: 'bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98]',
        primary: 'bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98] shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
        ghost: 'hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98]',
        outline: 'border border-border bg-transparent hover:bg-secondary active:scale-[0.98]',
        soft: 'bg-violet-50 text-violet-700 hover:bg-violet-100 active:scale-[0.98] dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-xl',
        default: 'h-11 px-5 text-sm rounded-2xl',
        lg: 'h-13 px-7 text-base rounded-2xl',
        xl: 'h-15 px-8 text-base rounded-2xl',
        icon: 'h-10 w-10 rounded-2xl',
        'icon-sm': 'h-8 w-8 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { buttonVariants }
