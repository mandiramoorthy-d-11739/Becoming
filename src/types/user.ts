export type CompanionStyle = 'warm_friend' | 'calm_coach' | 'gentle_guide' | 'direct_motivator'

export interface User {
  id: string
  name: string
  firstName: string
  avatarUrl?: string
  timezone: string
  locale: string
  onboardingCompleted: boolean
  companionStyle: CompanionStyle
  createdAt: string
}
