export type IdentityStatus = 'active' | 'paused' | 'archived'
export type IdentityAccent = 'violet' | 'green' | 'blue' | 'rose' | 'amber' | 'indigo' | 'teal' | 'orange'

export interface Identity {
  id: string
  userId: string
  name: string
  slug: string
  description: string
  icon: string
  accent: IdentityAccent
  status: IdentityStatus
  createdAt: string
  archivedAt?: string
}
