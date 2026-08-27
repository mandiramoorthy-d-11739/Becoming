import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <h2 className="text-lg font-medium tracking-tight text-balance">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
