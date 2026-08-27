export type ChallengeStatus = 'proposed' | 'accepted' | 'completed' | 'declined'
export type ChallengeType = 'open_ended' | 'duration_push' | 'consistency' | 'discovery'

export interface PersonalChallenge {
  id: string
  userId: string
  habitId: string
  title: string
  description: string
  challengeType: ChallengeType
  proposedAt: string
  acceptedAt?: string
  completedAt?: string
  resultValue?: number
  resultUnit?: string
  reflection?: string
  status: ChallengeStatus
}
