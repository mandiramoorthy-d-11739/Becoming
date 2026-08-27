export type SentimentLabel = 'positive' | 'neutral' | 'challenging' | 'difficult'

export interface Reflection {
  id: string
  userId: string
  habitId?: string
  identityId?: string
  date: string
  prompt: string
  response: string
  sentimentLabel: SentimentLabel
  createdAt: string
}

export interface WeeklyReflection {
  id: string
  userId: string
  weekStartDate: string
  whatFeltGood: string
  whatFeltDifficult: string
  whatBecameEasier: string
  whatToCarryForward: string
  summary: string
  createdAt: string
}
