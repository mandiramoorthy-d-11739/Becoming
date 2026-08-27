export type InsightType = 'pattern' | 'correlation' | 'suggestion' | 'milestone' | 'recovery'
export type InsightStatus = 'unread' | 'read' | 'saved' | 'dismissed'

export interface Insight {
  id: string
  userId: string
  type: InsightType
  title: string
  summary: string
  evidence: string
  relatedHabitIds: string[]
  relatedIdentityIds: string[]
  createdAt: string
  status: InsightStatus
}
