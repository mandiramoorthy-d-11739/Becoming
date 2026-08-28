export type MoodLevel = 'light' | 'balanced' | 'effortful' | 'hard'
export type EnergyLevel = 'low' | 'medium' | 'high'

export interface MoodCheckin {
  id: string
  userId: string
  date: string
  mood: MoodLevel
  energy: EnergyLevel
  note?: string
  createdAt: string
}
