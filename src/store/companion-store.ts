import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CompanionStyle, Message } from '@/types'

interface CompanionStore {
  activeConversationId: string
  draft: string
  companionStyle: CompanionStyle
  messages: Message[]
  isTyping: boolean
  setActiveConversation: (id: string) => void
  setDraft: (draft: string) => void
  setCompanionStyle: (style: CompanionStyle) => void
  addMessage: (msg: Message) => void
  setMessages: (msgs: Message[]) => void
  setIsTyping: (v: boolean) => void
}

export const useCompanionStore = create<CompanionStore>()(
  persist(
    (set) => ({
      activeConversationId: 'conv_1',
      draft: '',
      companionStyle: 'warm_friend',
      messages: [],
      isTyping: false,
      setActiveConversation: (activeConversationId) => set({ activeConversationId }),
      setDraft: (draft) => set({ draft }),
      setCompanionStyle: (companionStyle) => set({ companionStyle }),
      addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),
      setMessages: (messages) => set({ messages }),
      setIsTyping: (isTyping) => set({ isTyping }),
    }),
    { name: 'becoming_companion', partialize: (s) => ({ companionStyle: s.companionStyle, activeConversationId: s.activeConversationId }) }
  )
)
