'use client'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { OnboardingReminders } from '@/store/onboarding-store'

interface StepRemindersProps {
  reminders: OnboardingReminders
  onChange: (patch: Partial<OnboardingReminders>) => void
}

type ToggleKey = 'morningCheckin' | 'eveningReflection' | 'habitReminders' | 'challengeInvitations' | 'weeklyReflection'
type TimeKey = 'morningTime' | 'eveningTime'

interface ReminderRow {
  key: ToggleKey
  label: string
  description: string
  timeKey?: TimeKey
  timeLabel?: string
}

const REMINDER_ROWS: ReminderRow[] = [
  {
    key: 'morningCheckin',
    label: 'Morning check-in',
    description: 'A gentle start to the day, and a look at what you want it to hold.',
    timeKey: 'morningTime',
    timeLabel: 'Morning check-in time',
  },
  {
    key: 'eveningReflection',
    label: 'Evening reflection',
    description: 'A short look back before the day closes.',
    timeKey: 'eveningTime',
    timeLabel: 'Evening reflection time',
  },
  {
    key: 'habitReminders',
    label: 'Habit reminders',
    description: 'A quiet nudge at the time you planned to show up.',
  },
  {
    key: 'challengeInvitations',
    label: 'Challenge invitations',
    description: 'Occasional invitations to stretch a little further.',
  },
  {
    key: 'weeklyReflection',
    label: 'Weekly reflection',
    description: 'A wider view of how the week actually went.',
  },
]

export function StepReminders({ reminders, onChange }: StepRemindersProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          When should we check in?
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You can adjust these any time.
        </p>
      </header>

      <ul className="space-y-3">
        {REMINDER_ROWS.map((row) => {
          const isOn = reminders[row.key]
          const descriptionId = `${row.key}-description`

          return (
            <li key={row.key} className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <label htmlFor={row.key} className="block cursor-pointer font-medium">
                    {row.label}
                  </label>
                  <p id={descriptionId} className="text-sm leading-relaxed text-muted-foreground">
                    {row.description}
                  </p>
                </div>
                <Switch
                  id={row.key}
                  checked={isOn}
                  onCheckedChange={(checked) => onChange({ [row.key]: checked })}
                  aria-describedby={descriptionId}
                  className="mt-0.5 shrink-0"
                />
              </div>

              {row.timeKey && isOn && (
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
                  <label
                    htmlFor={`${row.key}-time`}
                    className="text-sm text-muted-foreground"
                  >
                    {row.timeLabel}
                  </label>
                  <input
                    id={`${row.key}-time`}
                    type="time"
                    value={reminders[row.timeKey]}
                    onChange={(event) =>
                      row.timeKey && onChange({ [row.timeKey]: event.target.value })
                    }
                    className={cn(
                      'h-10 rounded-2xl border border-border bg-card px-3 text-sm transition-colors',
                      'focus-visible:border-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
                    )}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
