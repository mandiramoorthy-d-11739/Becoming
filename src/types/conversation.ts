export type MessageRole = 'user' | 'companion'
export type SafetyState = 'normal' | 'sensitive' | 'crisis'

export interface SuggestedAction {
  type: 'create_habit' | 'adjust_habit' | 'start_challenge' | 'view_map' | 'reflect'
  label: string
  payload?: Record<string, unknown>
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  createdAt: string
  suggestedAction?: SuggestedAction
  safetyState?: SafetyState
  quickReplies?: string[]
}

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
  lastMessage?: string
}
