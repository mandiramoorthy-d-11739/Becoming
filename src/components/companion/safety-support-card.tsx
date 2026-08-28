'use client'
import { useState } from 'react'
import { HeartHandshake, LifeBuoy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SafetySupportCardProps {
  /** The companion's own words, shown above the support block. */
  content: string
}

const SUPPORT_PATHWAYS = [
  {
    icon: Users,
    label: 'Talk to someone you trust',
    detail: 'A friend, a family member, anyone who can sit with you right now.',
  },
  {
    icon: LifeBuoy,
    label: 'Contact a local crisis line',
    detail: 'Trained people are available to talk, usually around the clock.',
  },
  {
    icon: HeartHandshake,
    label: 'Reach out to a mental health professional',
    detail: 'Someone qualified to give you the kind of care this deserves.',
  },
] as const

export function SafetySupportCard({ content }: SafetySupportCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-3 rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
      <p className="text-sm leading-relaxed">{content}</p>

      <div className="h-px bg-amber-200 dark:bg-amber-900" role="presentation" />

      <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-500">
        Support
      </p>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Becoming is a growth companion, not a therapist or medical provider. If you&rsquo;re in
        crisis, please reach out to someone who can help right now.
      </p>

      <Button
        variant="primary"
        onClick={() => setOpen(true)}
        aria-label="Get support"
        aria-haspopup="dialog"
      >
        Get support
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-label="Ways to get support">
          <DialogHeader>
            <DialogTitle>Ways to get support</DialogTitle>
            <DialogDescription>
              You don&rsquo;t have to figure this out alone. Any of these is a good next step.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-3">
            {SUPPORT_PATHWAYS.map(({ icon: Icon, label, detail }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-snug">{label}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            This is a demo. In a real product, region-appropriate resources would appear here.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
