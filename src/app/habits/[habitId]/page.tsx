'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, MoreHorizontal, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { BecomingPath } from '@/components/habits/becoming-path'
import { HabitMiniMap } from '@/components/habits/habit-mini-map'
import {
  ProgressionSheet,
  formatTargetLong,
  formatTargetShort,
  suggestNextTarget,
} from '@/components/habits/progression-sheet'
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
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { getCheckins, getHabit, updateHabit } from '@/lib/api/habits'
import { getIdentities } from '@/lib/api/identities'
import { MOCK_PROGRESSIONS } from '@/data/seed'
import { cn, formatDate, subDays, toDateString } from '@/lib/utils'
import type { ComfortRating, Habit, HabitCheckin, HabitFrequency, Identity, Progression } from '@/types'

function isoDayOfWeek(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

function isScheduledOn(habit: Habit, date: Date): boolean {
  const day = isoDayOfWeek(date)
  switch (habit.schedule.frequency) {
    case 'daily': return true
    case 'weekdays': return day <= 5
    case 'weekends': return day >= 6
    case 'custom': return habit.schedule.daysOfWeek?.includes(day) ?? true
  }
}

const FREQUENCY_LABEL: Record<HabitFrequency, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom',
}

const COMFORT_LABEL: Record<ComfortRating, string> = {
  easy: 'Easy',
  right: 'About right',
  stretch: 'A stretch',
  too_much: 'Too much',
}

const COMFORT_PILL: Record<ComfortRating, string> = {
  easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  right: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  stretch: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  too_much: 'bg-secondary text-secondary-foreground',
}

const STATUS_NOTE: Record<Habit['status'], string | null> = {
  active: null,
  paused: 'This habit is paused. It stays here, and everything you built with it stays too.',
  archived: 'This habit is archived. Nothing was deleted — you can bring it back any time.',
}

const EDITABLE_FREQUENCIES = ['daily', 'weekdays', 'custom'] as const

const editSchema = z.object({
  name: z.string().refine(value => value.trim().length > 0, 'Give this habit a name.'),
  identityId: z.string().min(1, 'Choose who this habit belongs to.'),
  target: z.string().refine(value => Number(value) > 0, 'Pick a target above zero.'),
  frequency: z.enum(EDITABLE_FREQUENCIES),
  reminderTime: z.string(),
})

type EditValues = z.infer<typeof editSchema>

function toEditableFrequency(frequency: HabitFrequency): EditValues['frequency'] {
  return frequency === 'daily' || frequency === 'weekdays' ? frequency : 'custom'
}

function HabitDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-5 pt-10">
      <Skeleton className="h-4 w-16 rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-40 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-36 w-full rounded-3xl" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <Skeleton className="h-32 w-full rounded-3xl" />
    </div>
  )
}

export default function HabitDetailPage() {
  const params = useParams<{ habitId: string }>()
  const habitId = params.habitId
  const queryClient = useQueryClient()

  const habitQuery = useQuery({ queryKey: ['habit', habitId], queryFn: () => getHabit(habitId) })
  const identitiesQuery = useQuery({ queryKey: ['identities'], queryFn: getIdentities })
  const checkinsQuery = useQuery({
    queryKey: ['checkins', habitId],
    queryFn: () => getCheckins(habitId),
  })

  const [editOpen, setEditOpen] = useState(false)
  const [progressionOpen, setProgressionOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [newProgressions, setNewProgressions] = useState<Progression[]>([])

  const habit = habitQuery.data
  const identities = useMemo(() => identitiesQuery.data ?? [], [identitiesQuery.data])
  const identity: Identity | undefined = identities.find(item => item.id === habit?.identityId)

  const checkins = useMemo(
    () => [...(checkinsQuery.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [checkinsQuery.data]
  )

  const progressions = useMemo(
    () => [...MOCK_PROGRESSIONS.filter(p => p.habitId === habitId), ...newProgressions],
    [habitId, newProgressions]
  )

  const completion = useMemo(() => {
    if (!habit) return { percent: 0, completed: 0, scheduled: 0 }
    const byDate = new Map(checkins.map(checkin => [checkin.date, checkin]))
    const today = new Date()
    let scheduled = 0
    let completed = 0
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i)
      if (!isScheduledOn(habit, date)) continue
      scheduled += 1
      if (byDate.get(toDateString(date))?.status === 'complete') completed += 1
    }
    return {
      percent: scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100),
      completed,
      scheduled,
    }
  }, [habit, checkins])

  const latestComfort = useMemo(
    () => checkins.find(checkin => checkin.comfortRating !== undefined)?.comfortRating,
    [checkins]
  )

  const reflections = useMemo(
    () => checkins.filter((checkin): checkin is HabitCheckin & { note: string } => Boolean(checkin.note)),
    [checkins]
  )

  const recentComfort = useMemo(() => {
    const rated = checkins.filter(checkin => checkin.comfortRating !== undefined).slice(0, 9)
    return {
      total: rated.length,
      easy: rated.filter(checkin => checkin.comfortRating === 'easy').length,
    }
  }, [checkins])

  const recentActivity = useMemo(() => {
    const window = checkins.slice(0, 14)
    return {
      done: window.filter(checkin => checkin.status === 'complete').length,
      comfortable: window.filter(
        checkin => checkin.comfortRating === 'easy' || checkin.comfortRating === 'right'
      ).length,
      rated: window.filter(checkin => checkin.comfortRating !== undefined).length,
    }
  }, [checkins])

  const updateMutation = useMutation({
    mutationFn: (patch: Partial<Habit>) => updateHabit(habitId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['habit', habitId] })
      void queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  const handleAcceptProgression = useCallback(
    (target: number, days: number) => {
      if (!habit) return
      updateMutation.mutate({ currentTarget: target })
      setNewProgressions(previous => [
        ...previous,
        {
          id: `prog_local_${Date.now()}`,
          habitId,
          previousTarget: habit.currentTarget,
          proposedTarget: target,
          acceptedTarget: target,
          source: 'companion',
          reason: 'A small experiment you agreed to try.',
          experimentDurationDays: days,
          startedAt: toDateString(new Date()),
        },
      ])
      setStatusMessage(
        `We'll try ${formatTargetLong(habit, target)} for ${days} ${
          days === 1 ? 'day' : 'days'
        }. We'll ask how it felt after that.`
      )
    },
    [habit, habitId, updateMutation]
  )

  const handleDeclineProgression = useCallback(() => {
    setStatusMessage("No problem. We'll leave things exactly where they are.")
  }, [])

  const handleStatusChange = useCallback(
    (status: Habit['status']) => {
      updateMutation.mutate({ status })
      setEditOpen(false)
      setStatusMessage(
        status === 'paused'
          ? 'Paused. It will be here when you want it back.'
          : 'Archived. Nothing was deleted.'
      )
    },
    [updateMutation]
  )

  const handleSaveEdits = useCallback(
    (values: EditValues) => {
      if (!habit) return
      updateMutation.mutate({
        name: values.name.trim(),
        identityId: values.identityId,
        currentTarget: Number(values.target),
        schedule: {
          ...habit.schedule,
          frequency: values.frequency,
          reminderTime: values.reminderTime || undefined,
        },
      })
      setEditOpen(false)
      setStatusMessage('Saved.')
    },
    [habit, updateMutation]
  )

  if (habitQuery.isPending || identitiesQuery.isPending) {
    return <AppShell><HabitDetailSkeleton /></AppShell>
  }

  if (habitQuery.isError || !habit) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6 px-5 pt-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">This habit isn&rsquo;t here anymore.</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            It may have been archived. Everything else is still where you left it.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => void habitQuery.refetch()}>Try again</Button>
            <Button asChild variant="soft"><Link href="/today">Back to today</Link></Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const nextTarget = suggestNextTarget(habit)
  const statusNote = STATUS_NOTE[habit.status]

  const insightCopy =
    recentComfort.total >= 3 && recentComfort.easy >= 2
      ? `${formatTargetLong(habit, habit.currentTarget)} now feels easy on most days. You've rated it "Easy" ${
          recentComfort.easy
        } of the last ${recentComfort.total} times.`
      : `You've shown up for this ${completion.completed} of the last ${completion.scheduled} scheduled days. There's not quite enough yet to suggest a change — and that's fine.`

  const progressionEvidence = `You've kept ${habit.name.toLowerCase()} at ${formatTargetLong(
    habit,
    habit.currentTarget
  )} on ${recentActivity.done} of the last 14 days, and it's ${
    recentActivity.rated > 0 && recentActivity.comfortable >= recentActivity.rated / 2
      ? 'usually felt comfortable'
      : 'been a mixed picture'
  }.`

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8 px-5 pt-10">
        <Link href="/today" className="inline-flex items-center gap-1.5 rounded-xl text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Back to today
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            {identity && (
              <Link href={`/identities/${identity.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                <span aria-hidden="true">{identity.icon}</span>
                {identity.name}
              </Link>
            )}
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{habit.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatTargetShort(habit, habit.currentTarget)} · {FREQUENCY_LABEL[habit.schedule.frequency]}
              {habit.schedule.reminderTime ? ` · ${habit.schedule.reminderTime}` : ''}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" aria-label="Habit options" aria-haspopup="dialog" onClick={() => setEditOpen(true)}>
            <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </header>

        <p aria-live="polite" className={cn('text-sm leading-relaxed text-muted-foreground', statusMessage ? 'rounded-2xl bg-secondary/60 px-4 py-3' : 'sr-only')}>
          {statusMessage}
        </p>

        {statusNote && (
          <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {statusNote}
          </p>
        )}

        <section aria-labelledby="rhythm-heading" className="space-y-4">
          <h2 id="rhythm-heading" className="text-lg font-medium tracking-tight">Current rhythm</h2>
          <dl className="divide-y divide-border rounded-3xl border border-border bg-card">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-sm text-muted-foreground">Current target</dt>
              <dd className="text-sm font-medium">{formatTargetLong(habit, habit.currentTarget)}</dd>
            </div>
            <div className="space-y-2 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-sm text-muted-foreground">Last 30 days</dt>
                <dd className="text-sm font-medium tabular-nums">{completion.percent}%</dd>
              </div>
              {checkinsQuery.isPending ? (
                <Skeleton className="h-1.5 w-full rounded-full" />
              ) : (
                <Progress value={completion.percent} className="h-1.5" aria-label={`Completed ${completion.completed} of ${completion.scheduled} scheduled days`} />
              )}
              <p className="text-xs text-muted-foreground">{completion.completed} of {completion.scheduled} scheduled days</p>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-sm text-muted-foreground">How it last felt</dt>
              <dd>
                {latestComfort ? (
                  <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', COMFORT_PILL[latestComfort])}>
                    {COMFORT_LABEL[latestComfort]}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Not rated yet</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="path-heading" className="space-y-4">
          <h2 id="path-heading" className="text-lg font-medium tracking-tight">Your Becoming Path</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">Every change you&rsquo;ve made to this habit — including the ones you came back from.</p>
          <BecomingPath progressions={progressions} currentTarget={habit.currentTarget} unit={habit.unit} />
        </section>

        <section aria-labelledby="map-heading" className="space-y-4">
          <h2 id="map-heading" className="text-lg font-medium tracking-tight">Last 35 days</h2>
          {checkinsQuery.isPending ? (
            <Skeleton className="h-40 w-full rounded-3xl" />
          ) : checkinsQuery.isError ? (
            <ErrorState message="Your last 35 days didn't load." onRetry={() => void checkinsQuery.refetch()} />
          ) : (
            <HabitMiniMap checkins={checkins} days={35} />
          )}
        </section>

        <section aria-labelledby="reflections-heading" className="space-y-4">
          <h2 id="reflections-heading" className="text-lg font-medium tracking-tight">Reflections</h2>
          {reflections.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-sm leading-relaxed text-muted-foreground">Nothing written down yet. Anything you note when you check in will gather here.</p>
          ) : (
            <div className="space-y-3">
              {reflections.map(reflection => (
                <blockquote key={reflection.id} className="rounded-3xl border border-border bg-card p-5">
                  <p className="text-sm italic leading-relaxed text-balance">&ldquo;{reflection.note}&rdquo;</p>
                  <footer className="mt-2 text-xs text-muted-foreground">{formatDate(reflection.date, { month: 'short', day: 'numeric', year: 'numeric' })}</footer>
                </blockquote>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="insight-heading" className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5 dark:border-violet-900/50 dark:bg-violet-950/25">
          <h2 id="insight-heading" className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-violet-700/80 dark:text-violet-400/80">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Companion insight
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-violet-900 dark:text-violet-100 text-balance">{insightCopy}</p>
          <Button variant="soft" className="mt-4" aria-haspopup="dialog" onClick={() => setProgressionOpen(true)}>Explore a small experiment</Button>
        </section>

        <div className="pb-4" />
      </div>

      <ProgressionSheet habit={habit} open={progressionOpen} onOpenChange={setProgressionOpen} onAccept={handleAcceptProgression} onDecline={handleDeclineProgression} suggestedTarget={nextTarget} suggestedDays={4} evidence={progressionEvidence} />

      <EditHabitDialog habit={habit} identities={identities} open={editOpen} onOpenChange={setEditOpen} onSave={handleSaveEdits} onStatusChange={handleStatusChange} saving={updateMutation.isPending} />
    </AppShell>
  )
}

interface EditHabitDialogProps {
  habit: Habit
  identities: Identity[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: EditValues) => void
  onStatusChange: (status: Habit['status']) => void
  saving: boolean
}

function EditHabitDialog({ open, onOpenChange, ...form }: EditHabitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <EditHabitForm {...form} />
      </DialogContent>
    </Dialog>
  )
}

type EditHabitFormProps = Omit<EditHabitDialogProps, 'open' | 'onOpenChange'>

function EditHabitForm({ habit, identities, onSave, onStatusChange, saving }: EditHabitFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: habit.name,
      identityId: habit.identityId,
      target: String(habit.currentTarget),
      frequency: toEditableFrequency(habit.schedule.frequency),
      reminderTime: habit.schedule.reminderTime ?? '',
    },
  })

  const fieldClasses = cn(
    'h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm transition-colors',
    'focus-visible:border-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit this habit</DialogTitle>
        <DialogDescription>Change anything here. Smaller is always a valid answer.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="habit-name" className="block text-xs font-medium text-muted-foreground">Name</label>
          <Input id="habit-name" {...register('name')} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p role="alert" className="text-xs text-muted-foreground">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="habit-identity" className="block text-xs font-medium text-muted-foreground">Who this is for</label>
          <select id="habit-identity" className={fieldClasses} {...register('identityId')}>
            {identities.map(identity => <option key={identity.id} value={identity.id}>{identity.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="habit-target" className="block text-xs font-medium text-muted-foreground">Target{habit.unit ? ` (${habit.unit})` : ''}</label>
            <Input id="habit-target" type="number" min={0} step="any" inputMode="decimal" {...register('target')} />
            {errors.target && <p role="alert" className="text-xs text-muted-foreground">{errors.target.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="habit-frequency" className="block text-xs font-medium text-muted-foreground">How often</label>
            <select id="habit-frequency" className={fieldClasses} {...register('frequency')}>
              {EDITABLE_FREQUENCIES.map(frequency => <option key={frequency} value={frequency}>{FREQUENCY_LABEL[frequency]}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="habit-reminder" className="block text-xs font-medium text-muted-foreground">Reminder time</label>
          <Input id="habit-reminder" type="time" {...register('reminderTime')} />
          <p className="text-xs text-muted-foreground">Leave it empty for no reminder.</p>
        </div>
        <Button type="submit" variant="primary" className="w-full" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </form>
      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <p className="text-xs leading-relaxed text-muted-foreground">Stepping away is part of it. Neither of these deletes anything.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={saving} onClick={() => onStatusChange(habit.status === 'paused' ? 'active' : 'paused')}>
            {habit.status === 'paused' ? 'Resume habit' : 'Pause habit'}
          </Button>
          <Button variant="ghost" size="sm" disabled={saving || habit.status === 'archived'} onClick={() => onStatusChange('archived')}>Archive</Button>
        </div>
      </div>
    </>
  )
}