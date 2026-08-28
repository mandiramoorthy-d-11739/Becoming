import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { IdentityAccent } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', options ?? { month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatShortDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getDayOfWeek(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export function getGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name}.`
  if (hour < 17) return `Good afternoon, ${name}.`
  return `Good evening, ${name}.`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getAccentColors(accent: IdentityAccent): { bg: string; text: string; border: string; soft: string } {
  const map: Record<IdentityAccent, { bg: string; text: string; border: string; soft: string }> = {
    violet: { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', soft: 'bg-violet-50 dark:bg-violet-950/30' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', soft: 'bg-indigo-50 dark:bg-indigo-950/30' },
    green: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', soft: 'bg-emerald-50 dark:bg-emerald-950/30' },
    teal: { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', soft: 'bg-teal-50 dark:bg-teal-950/30' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', soft: 'bg-blue-50 dark:bg-blue-950/30' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', soft: 'bg-rose-50 dark:bg-rose-950/30' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', soft: 'bg-amber-50 dark:bg-amber-950/30' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', soft: 'bg-orange-50 dark:bg-orange-950/30' },
  }
  return map[accent]
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date())
}

export function getDateRange(range: '30d' | '90d' | '6m' | '1y'): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  if (range === '30d') start.setDate(end.getDate() - 29)
  else if (range === '90d') start.setDate(end.getDate() - 89)
  else if (range === '6m') start.setMonth(end.getMonth() - 6)
  else start.setFullYear(end.getFullYear() - 1)
  return { start, end }
}
