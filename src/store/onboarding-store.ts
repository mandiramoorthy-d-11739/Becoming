import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CompanionStyle } from '@/types'

interface OnboardingStore {
  completed: boolean
  selectedIdentityIds: string[]
  customIdentityText: string
  selectedHabitIds: string[]
  companionStyle: CompanionStyle
  reminders: {
    morningCheckin: boolean
    morningTime: string
    eveningReflection: boolean
    eveningTime: string
    habitReminders: boolean
    challengeInvitations: boolean
    weeklyReflection: boolean
  }
  setCompleted: (v: boolean) => void
  setSelectedIdentities: (ids: string[]) => void
  setCustomIdentityText: (text: string) => void
  setSelectedHabits: (ids: string[]) => void
  setCompanionStyle: (style: CompanionStyle) => void
  setReminders: (r: Partial<OnboardingStore['reminders']>) => void
  reset: () => void
}

export type OnboardingReminders = OnboardingStore['reminders']

const defaultReminders = {
  morningCheckin: true,
  morningTime: '07:30',
  eveningReflection: true,
  eveningTime: '21:00',
  habitReminders: true,
  challengeInvitations: true,
  weeklyReflection: true,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      selectedIdentityIds: [],
      customIdentityText: '',
      selectedHabitIds: [],
      companionStyle: 'warm_friend',
      reminders: defaultReminders,
      setCompleted: (completed) => set({ completed }),
      setSelectedIdentities: (selectedIdentityIds) => set({ selectedIdentityIds }),
      setCustomIdentityText: (customIdentityText) => set({ customIdentityText }),
      setSelectedHabits: (selectedHabitIds) => set({ selectedHabitIds }),
      setCompanionStyle: (companionStyle) => set({ companionStyle }),
      setReminders: (r) => set(s => ({ reminders: { ...s.reminders, ...r } })),
      reset: () => set({ completed: false, selectedIdentityIds: [], customIdentityText: '', selectedHabitIds: [] }),
    }),
    { name: 'becoming_onboarding' }
  )
)
