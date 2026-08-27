export type HabitType = 'binary' | 'duration' | 'count' | 'reduction' | 'quantity'
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom'
export type HabitStatus = 'active' | 'paused' | 'archived'
export type ComfortRating = 'easy' | 'right' | 'stretch' | 'too_much'
export type CheckinStatus = 'complete' | 'partial' | 'skipped' | 'missed'

export interface HabitSchedule {
  frequency: HabitFrequency
  daysOfWeek?: number[]
  reminderTime?: string
}

export interface Habit {
  id: string
  userId: string
  identityId: string
  name: string
  description?: string
  type: HabitType
  unit?: string
  currentTarget: number
  schedule: HabitSchedule
  effortLevel: 'low' | 'medium' | 'high'
  status: HabitStatus
  createdAt: string
  updatedAt: string
}

export interface HabitCheckin {
  id: string
  habitId: string
  userId: string
  date: string
  status: CheckinStatus
  actualValue?: number
  targetValue: number
  comfortRating?: ComfortRating
  note?: string
  createdAt: string
}
