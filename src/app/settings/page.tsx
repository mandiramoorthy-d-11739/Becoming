'use client'

import { useCallback, useId, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { CompanionStylePicker } from '@/components/companion/companion-style-picker'
import { ErrorState } from '@/components/feedback/error-state'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { getUser, updateUser } from '@/lib/api/user'
import { COMPANION_STYLES } from '@/lib/constants'
import { cn, toDateString } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { useCompanionStore } from '@/store/companion-store'
import { useOnboardingStore, type OnboardingReminders } from '@/store/onboarding-store'
import type { CompanionStyle, User } from '@/types'

/* -------------------------------------------------------------------------- */
/* Hydration                                                                   */
/* -------------------------------------------------------------------------- */

const noopSubscribe = () => () => {}

/**
 * Persisted stores read localStorage on the client only, so anything driven by
 * them waits for hydration rather than flashing the wrong state.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

/* -------------------------------------------------------------------------- */
/* Layout pieces                                                               */
/* -------------------------------------------------------------------------- */

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2
        id={headingId}
        className="px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
      >
        {title}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {children}
      </div>
    </section>
  )
}

function SettingsRow({
  label,
  description,
  labelFor,
  children,
}: {
  label: string
  description?: string
  labelFor?: string
  children: React.ReactNode
}) {
  const Label = labelFor ? 'label' : 'span'
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0 space-y-0.5">
        <Label
          {...(labelFor ? { htmlFor: labelFor } : {})}
          className={cn('block text-sm font-medium', labelFor && 'cursor-pointer')}
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function ChevronRow({
  label,
  description,
  onClick,
}: {
  label: string
  description?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn(
        'flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors',
        'hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500'
      )}
    >
      <span className="min-w-0 space-y-0.5">
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="block text-xs leading-relaxed text-muted-foreground">{description}</span>
        )}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const TIMEZONES: ReadonlyArray<string> = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Athens',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const DEMO_AVATARS: ReadonlyArray<string> = [
  'https://images.unsplash.com/photo-1494790108755-2616b332c3c5?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
]

const THEME_OPTIONS = ['system', 'light', 'dark'] as const
type ThemeOption = (typeof THEME_OPTIONS)[number]

const THEME_LABEL: Record<ThemeOption, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

interface ReminderRow {
  key: keyof Pick<
    OnboardingReminders,
    | 'morningCheckin'
    | 'eveningReflection'
    | 'habitReminders'
    | 'challengeInvitations'
    | 'weeklyReflection'
  >
  label: string
  description: string
  timeKey?: keyof Pick<OnboardingReminders, 'morningTime' | 'eveningTime'>
}

const REMINDER_ROWS: ReadonlyArray<ReminderRow> = [
  {
    key: 'morningCheckin',
    label: 'Morning check-in',
    description: 'A gentle start, and a look at what you want the day to hold.',
    timeKey: 'morningTime',
  },
  {
    key: 'eveningReflection',
    label: 'Evening reflection',
    description: 'A short look back before the day closes.',
    timeKey: 'eveningTime',
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

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const hydrated = useHydrated()

  const userQuery = useQuery({ queryKey: ['user'], queryFn: getUser })
  const user = userQuery.data

  const theme = useAppStore(state => state.theme)
  const setTheme = useAppStore(state => state.setTheme)
  const reducedMotion = useAppStore(state => state.reducedMotion)
  const setReducedMotion = useAppStore(state => state.setReducedMotion)

  const reminders = useOnboardingStore(state => state.reminders)
  const setReminders = useOnboardingStore(state => state.setReminders)

  const companionStyle = useCompanionStore(state => state.companionStyle)
  const setCompanionStyle = useCompanionStore(state => state.setCompanionStyle)
  const setMessages = useCompanionStore(state => state.setMessages)

  const [styleOpen, setStyleOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [wellbeingOpen, setWellbeingOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const userMutation = useMutation({
    mutationFn: (patch: Partial<User>) => updateUser(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: () => setAnnouncement("That didn't save. Nothing changed."),
  })

  const handleExport = useCallback(() => {
    const data: Record<string, unknown> = {}
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index)
      if (!key || !key.startsWith('becoming_')) continue
      const raw = window.localStorage.getItem(key)
      try {
        data[key] = raw === null ? null : JSON.parse(raw)
      } catch {
        data[key] = raw
      }
    }

    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `becoming-${toDateString(new Date())}.json`
    link.click()
    URL.revokeObjectURL(url)
    setAnnouncement('Your data has been downloaded.')
  }, [])

  const handleClearData = useCallback(() => {
    window.localStorage.clear()
    window.location.reload()
  }, [])

  const handleResetConversations = useCallback(() => {
    setMessages([])
    void queryClient.invalidateQueries({ queryKey: ['messages'] })
    void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    setResetOpen(false)
    setAnnouncement('Your conversations have been cleared.')
  }, [queryClient, setMessages])

  const handleAvatarChange = useCallback(() => {
    if (!user) return
    const current = DEMO_AVATARS.indexOf(user.avatarUrl ?? '')
    const next = DEMO_AVATARS[(current + 1) % DEMO_AVATARS.length]
    userMutation.mutate({ avatarUrl: next })
    setAnnouncement('Photo updated.')
  }, [user, userMutation])

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8 px-5 pt-10">
        <Link
          href="/you"
          className="inline-flex items-center gap-1.5 rounded-xl text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Back to you
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {userQuery.isError && (
          <ErrorState message="Your profile didn't load." onRetry={() => void userQuery.refetch()} />
        )}

        {/* PROFILE -------------------------------------------------------- */}
        <SettingsSection title="Profile">
          {userQuery.isPending || !user ? (
            <div className="space-y-4 p-5">
              <Skeleton className="h-11 w-full rounded-2xl" />
              <Skeleton className="h-11 w-full rounded-2xl" />
              <Skeleton className="h-11 w-full rounded-2xl" />
            </div>
          ) : (
            <ProfileRows
              key={user.id}
              user={user}
              saving={userMutation.isPending}
              onSaveName={name => {
                if (name.trim().length === 0 || name === user.name) return
                userMutation.mutate({ name, firstName: name.trim().split(' ')[0] })
                setAnnouncement('Name saved.')
              }}
              onChangeAvatar={handleAvatarChange}
              onChangeTimezone={timezone => {
                userMutation.mutate({ timezone })
                setAnnouncement('Time zone saved.')
              }}
            />
          )}
        </SettingsSection>

        {/* COMPANION ------------------------------------------------------ */}
        <SettingsSection title="Companion">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0 space-y-0.5">
              <span className="block text-sm font-medium">Style</span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {hydrated
                  ? COMPANION_STYLES[companionStyle].description
                  : 'How your companion speaks to you.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              aria-haspopup="dialog"
              onClick={() => setStyleOpen(true)}
              className="shrink-0"
            >
              {hydrated ? COMPANION_STYLES[companionStyle].label : 'Choose'}
            </Button>
          </div>

          <SettingsRow
            label="Reset conversations"
            description="Clears your chat history. Your habits and reflections stay."
          >
            <Button
              variant="ghost"
              size="sm"
              aria-haspopup="dialog"
              onClick={() => setResetOpen(true)}
            >
              Reset
            </Button>
          </SettingsRow>
        </SettingsSection>

        {/* REMINDERS ------------------------------------------------------ */}
        <SettingsSection title="Reminders">
          {REMINDER_ROWS.map(row => (
            <div key={row.key}>
              <SettingsRow label={row.label} description={row.description} labelFor={`reminder-${row.key}`}>
                {hydrated ? (
                  <Switch
                    id={`reminder-${row.key}`}
                    checked={reminders[row.key]}
                    onCheckedChange={checked => setReminders({ [row.key]: checked })}
                  />
                ) : (
                  <Skeleton className="h-6 w-11 rounded-full" />
                )}
              </SettingsRow>

              {row.timeKey && hydrated && reminders[row.key] && (
                <div className="flex items-center justify-between gap-4 border-t border-border bg-secondary/30 px-5 py-3">
                  <label htmlFor={`time-${row.key}`} className="text-xs text-muted-foreground">
                    Time
                  </label>
                  <input
                    id={`time-${row.key}`}
                    type="time"
                    value={reminders[row.timeKey]}
                    onChange={event =>
                      row.timeKey && setReminders({ [row.timeKey]: event.target.value })
                    }
                    className={cn(
                      'h-9 rounded-xl border border-border bg-card px-3 text-sm transition-colors',
                      'focus-visible:border-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </SettingsSection>

        {/* APPEARANCE ----------------------------------------------------- */}
        <SettingsSection title="Appearance">
          <SettingsRow label="Theme" description="Match your device, or pick one.">
            {hydrated ? (
              <div
                role="group"
                aria-label="Theme"
                className="flex items-center gap-1 rounded-2xl bg-secondary p-1"
              >
                {THEME_OPTIONS.map(option => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={theme === option}
                    onClick={() => setTheme(option)}
                    className={cn(
                      'h-8 rounded-xl px-3 text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                      theme === option
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {THEME_LABEL[option]}
                  </button>
                ))}
              </div>
            ) : (
              <Skeleton className="h-10 w-48 rounded-2xl" />
            )}
          </SettingsRow>

          <SettingsRow
            label="Reduce motion"
            description="Turns off the gentle animations across the app."
            labelFor="reduce-motion"
          >
            {hydrated ? (
              <Switch
                id="reduce-motion"
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
              />
            ) : (
              <Skeleton className="h-6 w-11 rounded-full" />
            )}
          </SettingsRow>
        </SettingsSection>

        {/* DATA & PRIVACY ------------------------------------------------- */}
        <SettingsSection title="Data & privacy">
          <SettingsRow label="Export data" description="Download everything as a JSON file.">
            <Button variant="ghost" size="sm" onClick={handleExport}>
              Export
            </Button>
          </SettingsRow>

          <SettingsRow
            label="Clear local demo data"
            description="Resets this browser back to the starting state."
          >
            <Button
              variant="ghost"
              size="sm"
              aria-haspopup="dialog"
              onClick={() => setClearOpen(true)}
            >
              Clear
            </Button>
          </SettingsRow>

          <p className="px-5 py-4 text-xs leading-relaxed text-muted-foreground">
            Becoming stores your demo data locally in this browser. Nothing is sent anywhere.
          </p>
        </SettingsSection>

        {/* SUPPORT -------------------------------------------------------- */}
        <SettingsSection title="Support">
          <ChevronRow
            label="Help"
            description="How Becoming works, and what to do when it doesn't."
            onClick={() => setHelpOpen(true)}
          />
          <ChevronRow label="About Becoming" onClick={() => setAboutOpen(true)} />
          <ChevronRow
            label="Wellbeing support"
            description="If you need more than an app can give."
            onClick={() => setWellbeingOpen(true)}
          />
        </SettingsSection>

        <div className="pb-4" />
      </div>

      {/* Companion style ------------------------------------------------- */}
      <Dialog open={styleOpen} onOpenChange={setStyleOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How should your companion sound?</DialogTitle>
            <DialogDescription>
              You can change this any time. It only affects how things are said, never what
              you&rsquo;re asked to do.
            </DialogDescription>
          </DialogHeader>

          <CompanionStylePicker
            value={companionStyle}
            onChange={(style: CompanionStyle) => {
              setCompanionStyle(style)
              userMutation.mutate({ companionStyle: style })
              setAnnouncement(`Companion style set to ${COMPANION_STYLES[style].label}.`)
            }}
          />

          <Button variant="primary" className="mt-6 w-full" onClick={() => setStyleOpen(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Reset conversations --------------------------------------------- */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear your conversations?</DialogTitle>
            <DialogDescription>
              Your chat history will be removed from this browser. Your habits, reflections and
              progress all stay exactly where they are.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleResetConversations}>
              Clear conversations
            </Button>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Keep them
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear local data ------------------------------------------------- */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear the demo data in this browser?</DialogTitle>
            <DialogDescription>
              Everything stored locally will be removed and the app will start over. This
              can&rsquo;t be undone — you may want to export first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleClearData}>
              Clear everything
            </Button>
            <Button variant="ghost" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help ------------------------------------------------------------- */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help</DialogTitle>
            <DialogDescription>A few things worth knowing.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              Habits are meant to be small. If one feels heavy, open it and make it smaller —
              that&rsquo;s a normal thing to do, not a failure.
            </li>
            <li>
              Your companion suggests experiments. Nothing changes unless you choose it, and you can
              always come back down.
            </li>
            <li>Missed days aren&rsquo;t tracked as failures. Nothing here resets on you.</li>
          </ul>
        </DialogContent>
      </Dialog>

      {/* About ------------------------------------------------------------ */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About Becoming</DialogTitle>
            <DialogDescription>
              Becoming is a personal growth companion. It is not a therapist, medical provider, or a
              replacement for professional mental-health care.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This is a demo build. Everything you see runs locally in your browser.
          </p>
        </DialogContent>
      </Dialog>

      {/* Wellbeing support ------------------------------------------------ */}
      <Dialog open={wellbeingOpen} onOpenChange={setWellbeingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wellbeing support</DialogTitle>
            <DialogDescription>
              If things feel heavier than habits can hold, please reach for someone who can help
              right now.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Talk to someone you trust — a friend, a family member, anyone nearby.</li>
            <li>Contact a local crisis line. Trained people are usually available around the clock.</li>
            <li>Reach out to a mental health professional for the kind of care this deserves.</li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            This is a demo. In a real product, region-appropriate resources would appear here.
          </p>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

/* -------------------------------------------------------------------------- */
/* Profile rows                                                                */
/* -------------------------------------------------------------------------- */

interface ProfileRowsProps {
  user: User
  saving: boolean
  onSaveName: (name: string) => void
  onChangeAvatar: () => void
  onChangeTimezone: (timezone: string) => void
}

function ProfileRows({
  user,
  saving,
  onSaveName,
  onChangeAvatar,
  onChangeTimezone,
}: ProfileRowsProps) {
  const [name, setName] = useState(user.name)
  const timezones = TIMEZONES.includes(user.timezone) ? TIMEZONES : [user.timezone, ...TIMEZONES]

  return (
    <>
      <SettingsRow label="Name" labelFor="profile-name">
        <Input
          id="profile-name"
          value={name}
          disabled={saving}
          onChange={event => setName(event.target.value)}
          onBlur={() => onSaveName(name)}
          className="h-10 w-44"
        />
      </SettingsRow>

      <SettingsRow label="Photo" description="Used only on your own screen.">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
            >
              {user.firstName.charAt(0)}
            </span>
          )}
          <Button variant="ghost" size="sm" disabled={saving} onClick={onChangeAvatar}>
            Change
          </Button>
        </div>
      </SettingsRow>

      <SettingsRow
        label="Time zone"
        description="Reminders and daily resets follow this."
        labelFor="profile-timezone"
      >
        <select
          id="profile-timezone"
          value={user.timezone}
          disabled={saving}
          onChange={event => onChangeTimezone(event.target.value)}
          className={cn(
            'h-10 w-44 rounded-2xl border border-border bg-card px-3 text-sm transition-colors',
            'focus-visible:border-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {timezones.map(timezone => (
            <option key={timezone} value={timezone}>
              {timezone.split('/').pop()?.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </SettingsRow>
    </>
  )
}
