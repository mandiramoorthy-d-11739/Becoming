export type MapIntensity = 0 | 1 | 2 | 3 | 4

export interface BecomingMapDay {
  date: string
  score: number
  intensity: MapIntensity
  completedHabitIds: string[]
  identityIds: string[]
  mood?: import('./mood').MoodLevel
  milestoneCount: number
  reflectionSnippet?: string
  summary?: string
}

export type MapRange = '30d' | '90d' | '6m' | '1y'
