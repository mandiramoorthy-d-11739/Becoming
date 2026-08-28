export type ProgressionSource = 'user' | 'companion' | 'challenge'
export type ProgressionOutcome = 'kept' | 'reverted' | 'adjusted'

export interface Progression {
  id: string
  habitId: string
  previousTarget: number
  proposedTarget: number
  acceptedTarget?: number
  source: ProgressionSource
  reason: string
  experimentDurationDays: number
  startedAt: string
  endedAt?: string
  outcome?: ProgressionOutcome
  userFeedback?: 'too_much' | 'about_right' | 'surprisingly_easy'
}
