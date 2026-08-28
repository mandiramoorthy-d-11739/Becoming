export const COMPANION_STYLES = {
  warm_friend: {
    label: 'Warm Friend',
    description: 'Encouraging, human, gentle.',
    preview: ['You showed up today. That matters.', "Even on harder days, you're still here."],
  },
  calm_coach: {
    label: 'Calm Coach',
    description: 'Grounded, thoughtful, reflective.',
    preview: ["Your pattern is becoming more consistent. Want to explore what's helping?", 'I notice you tend to do better on mornings you start small.'],
  },
  gentle_guide: {
    label: 'Gentle Guide',
    description: 'Soft, patient, low-pressure.',
    preview: ['No need to force it. What would feel manageable today?', "There's no rush. Let's find what feels right."],
  },
  direct_motivator: {
    label: 'Direct Motivator',
    description: 'Clear, concise, energetic without aggression.',
    preview: ["You've got momentum. Let's use it.", 'Strong week. Ready to keep it going?'],
  },
} as const

export const IDENTITY_OPTIONS = [
  { slug: 'calmer', name: 'Calmer Me', icon: '🧘', accent: 'violet' as const, description: 'Build more space between you and the noise.' },
  { slug: 'healthier', name: 'Healthier Me', icon: '🌱', accent: 'green' as const, description: 'Take care of the body that carries you.' },
  { slug: 'stronger', name: 'Stronger Me', icon: '💪', accent: 'amber' as const, description: 'Build strength and physical resilience.' },
  { slug: 'focused', name: 'More Focused Me', icon: '🎯', accent: 'blue' as const, description: 'Create deeper attention and less distraction.' },
  { slug: 'social', name: 'More Social Me', icon: '🤝', accent: 'rose' as const, description: 'Build more meaningful human connection.' },
  { slug: 'rested', name: 'Better Rested Me', icon: '🌙', accent: 'indigo' as const, description: 'Protect and improve your sleep and recovery.' },
  { slug: 'creative', name: 'More Creative Me', icon: '✨', accent: 'orange' as const, description: 'Make more space for creative expression.' },
  { slug: 'disciplined', name: 'More Disciplined Me', icon: '⚡', accent: 'teal' as const, description: 'Build follow-through and consistency.' },
  { slug: 'smoke-free', name: 'Smoke-Free Me', icon: '🌬️', accent: 'green' as const, description: 'Reduce and eventually eliminate smoking.' },
] as const

export const RECOVERY_COPY = [
  "Yesterday was a pause. Your progress is still here.",
  "Want to ease back in today?",
  "Consistency is built over time, not in perfect lines.",
  "You came back. That matters.",
  "Things have been quieter lately. That doesn't erase what you've built.",
]

export const MAP_RANGE_OPTIONS = [
  { value: '30d' as const, label: '30D' },
  { value: '90d' as const, label: '90D' },
  { value: '6m' as const, label: '6M' },
  { value: '1y' as const, label: '1Y' },
]
