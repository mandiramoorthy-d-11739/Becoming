import type { Habit, HabitFrequency, IdentityAccent } from '@/types'
import { IDENTITY_OPTIONS } from '@/lib/constants'

export type EffortLevel = Habit['effortLevel']

export type IdentityOption = (typeof IDENTITY_OPTIONS)[number]

/** A habit we propose during onboarding, before it becomes a real Habit. */
export interface HabitSuggestion {
  id: string
  name: string
  identitySlug: string
  identityName: string
  identityAccent: IdentityAccent
  target: number
  unit: string
  frequency: HabitFrequency
  effortLevel: EffortLevel
}

/** The user-editable part of a suggestion. */
export interface HabitDraft {
  target: number
  frequency: HabitFrequency
}

/**
 * The result of "reading" a free-text identity description. `starts` holds four
 * habits: the first three are previewed back to the user, the fourth keeps the
 * later "pick your first steps" grid at a full set of four.
 */
export interface CustomIdentityDraft {
  slug: string
  name: string
  icon: string
  accent: IdentityAccent
  description: string
  starts: HabitSuggestion[]
}

export const PREVIEWED_STARTS = 3

export const CUSTOM_IDENTITY_SLUG = 'my-own'

export const FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  custom: 'Custom days',
}

export const FREQUENCY_OPTIONS: HabitFrequency[] = ['daily', 'weekdays', 'weekends']

export const EFFORT_LABELS: Record<EffortLevel, string> = {
  low: 'Low effort',
  medium: 'Medium effort',
  high: 'High effort',
}

/** Singular forms for the units used below. English plurals are not worth guessing. */
const UNIT_SINGULARS: Record<string, string> = {
  cigarettes: 'cigarette',
  conversations: 'conversation',
  glasses: 'glass',
  ideas: 'idea',
  invitations: 'invitation',
  meals: 'meal',
  messages: 'message',
  min: 'min',
  moments: 'moment',
  mornings: 'morning',
  nights: 'night',
  notes: 'note',
  pages: 'page',
  promises: 'promise',
  reps: 'rep',
  things: 'thing',
}

export function formatTargetLine(target: number, unit: string, frequency: HabitFrequency): string {
  const label = target === 1 ? (UNIT_SINGULARS[unit] ?? unit) : unit
  const amount = label ? `${target} ${label}` : `${target}`
  return `${amount} · ${FREQUENCY_LABELS[frequency]}`
}

type SeedHabit = Pick<HabitSuggestion, 'name' | 'target' | 'unit' | 'frequency' | 'effortLevel'>

/**
 * Small starts, one identity at a time. Every target here is deliberately tiny —
 * the whole point is that showing up is easier than skipping.
 */
const HABITS_BY_IDENTITY: Record<string, SeedHabit[]> = {
  calmer: [
    { name: 'Three quiet minutes', target: 3, unit: 'min', frequency: 'daily', effortLevel: 'low' },
    { name: 'One slow breath before you answer', target: 1, unit: 'moments', frequency: 'daily', effortLevel: 'low' },
    { name: 'Step outside at lunch', target: 5, unit: 'min', frequency: 'weekdays', effortLevel: 'low' },
    { name: 'Put the day down for five minutes', target: 5, unit: 'min', frequency: 'daily', effortLevel: 'low' },
  ],
  healthier: [
    { name: 'A short walk', target: 10, unit: 'min', frequency: 'daily', effortLevel: 'low' },
    { name: 'A glass of water when you wake', target: 1, unit: 'glasses', frequency: 'daily', effortLevel: 'low' },
    { name: 'Something green with dinner', target: 1, unit: 'meals', frequency: 'daily', effortLevel: 'low' },
    { name: 'Cook one meal at home', target: 1, unit: 'meals', frequency: 'weekdays', effortLevel: 'medium' },
  ],
  stronger: [
    { name: 'Ten push-ups', target: 10, unit: 'reps', frequency: 'daily', effortLevel: 'medium' },
    { name: 'Carry something heavy', target: 5, unit: 'min', frequency: 'weekdays', effortLevel: 'medium' },
    { name: 'Stretch before bed', target: 4, unit: 'min', frequency: 'daily', effortLevel: 'low' },
    { name: 'Squats while the kettle boils', target: 15, unit: 'reps', frequency: 'daily', effortLevel: 'low' },
  ],
  focused: [
    { name: 'One phone-free hour', target: 60, unit: 'min', frequency: 'weekdays', effortLevel: 'medium' },
    { name: 'Start the day on one thing', target: 25, unit: 'min', frequency: 'weekdays', effortLevel: 'medium' },
    { name: 'Phone in another room while you work', target: 30, unit: 'min', frequency: 'weekdays', effortLevel: 'low' },
    { name: 'Close the extra tabs', target: 1, unit: 'moments', frequency: 'weekdays', effortLevel: 'low' },
  ],
  social: [
    { name: 'Message one person you miss', target: 1, unit: 'messages', frequency: 'daily', effortLevel: 'low' },
    { name: 'One real conversation', target: 1, unit: 'conversations', frequency: 'weekends', effortLevel: 'medium' },
    { name: 'Say yes to one invitation', target: 1, unit: 'invitations', frequency: 'weekends', effortLevel: 'medium' },
    { name: 'Ask one real question', target: 1, unit: 'conversations', frequency: 'daily', effortLevel: 'low' },
  ],
  rested: [
    { name: 'Screens down before bed', target: 30, unit: 'min', frequency: 'daily', effortLevel: 'medium' },
    { name: 'Lights out at the same time', target: 1, unit: 'nights', frequency: 'daily', effortLevel: 'medium' },
    { name: 'Open the curtains first thing', target: 1, unit: 'mornings', frequency: 'daily', effortLevel: 'low' },
    { name: 'Wake at the same time', target: 1, unit: 'mornings', frequency: 'daily', effortLevel: 'medium' },
  ],
  creative: [
    { name: 'Ten minutes of making', target: 10, unit: 'min', frequency: 'daily', effortLevel: 'low' },
    { name: 'Fill one page', target: 1, unit: 'pages', frequency: 'daily', effortLevel: 'low' },
    { name: 'Collect one idea worth keeping', target: 1, unit: 'ideas', frequency: 'daily', effortLevel: 'low' },
    { name: 'Ten minutes of input, not output', target: 10, unit: 'min', frequency: 'weekdays', effortLevel: 'low' },
  ],
  disciplined: [
    { name: 'Make the bed', target: 1, unit: 'mornings', frequency: 'daily', effortLevel: 'low' },
    { name: 'Plan tomorrow tonight', target: 5, unit: 'min', frequency: 'weekdays', effortLevel: 'low' },
    { name: 'Finish one thing you started', target: 1, unit: 'things', frequency: 'daily', effortLevel: 'medium' },
    { name: 'Put one thing back where it belongs', target: 1, unit: 'things', frequency: 'daily', effortLevel: 'low' },
  ],
  'smoke-free': [
    { name: 'One fewer than yesterday', target: 1, unit: 'cigarettes', frequency: 'daily', effortLevel: 'medium' },
    { name: 'Wait ten minutes before the first one', target: 10, unit: 'min', frequency: 'daily', effortLevel: 'low' },
    { name: 'Walk through the craving', target: 3, unit: 'min', frequency: 'daily', effortLevel: 'medium' },
    { name: 'Note what set it off', target: 1, unit: 'notes', frequency: 'daily', effortLevel: 'low' },
  ],
}

function toSuggestion(
  seed: SeedHabit,
  identity: { slug: string; name: string; accent: IdentityAccent }
): HabitSuggestion {
  return {
    ...seed,
    id: `${identity.slug}__${seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    identitySlug: identity.slug,
    identityName: identity.name,
    identityAccent: identity.accent,
  }
}

/**
 * Builds four first steps, taking one habit per selected identity in turn so
 * every direction the user picked is represented before any repeats.
 */
export function buildHabitSuggestions(
  selectedIdentitySlugs: string[],
  customIdentity: CustomIdentityDraft | null,
  limit = 4
): HabitSuggestion[] {
  const pools: HabitSuggestion[][] = []

  for (const slug of selectedIdentitySlugs) {
    const option = IDENTITY_OPTIONS.find((identity) => identity.slug === slug)
    const seeds = HABITS_BY_IDENTITY[slug]
    if (!option || !seeds) continue
    pools.push(seeds.map((seed) => toSuggestion(seed, option)))
  }

  if (customIdentity) pools.push(customIdentity.starts)

  const picked: HabitSuggestion[] = []
  for (let round = 0; picked.length < limit; round += 1) {
    const available = pools.filter((pool) => pool[round] !== undefined)
    if (available.length === 0) break
    for (const pool of available) {
      if (picked.length >= limit) break
      picked.push(pool[round])
    }
  }

  return picked
}

const CUSTOM_IDENTITY_SHAPES = [
  {
    match: ['calm', 'calmer', 'anxious', 'anxiety', 'stress', 'stressed', 'overwhelm', 'peace', 'patient'],
    name: 'Calmer Me',
    icon: '🧘',
    accent: 'violet' as IdentityAccent,
    description: 'Build more space between you and the noise.',
    starts: [
      { name: 'Three quiet minutes', target: 3, unit: 'min', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
      { name: 'One slow breath before you answer', target: 1, unit: 'moments', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
      { name: 'Name the feeling once a day', target: 1, unit: 'notes', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
      { name: 'Put the day down for five minutes', target: 5, unit: 'min', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
    ],
  },
  {
    match: ['body', 'health', 'healthy', 'healthier', 'fit', 'fitness', 'move', 'walk', 'eat', 'sleep', 'strong'],
    name: 'Healthier Me',
    icon: '🌱',
    accent: 'green' as IdentityAccent,
    description: 'Take care of the body that carries you.',
    starts: [
      { name: 'A short walk', target: 10, unit: 'min', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
      { name: 'A glass of water when you wake', target: 1, unit: 'glasses', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
      { name: 'Stretch before bed', target: 4, unit: 'min', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
      { name: 'Cook one meal at home', target: 1, unit: 'meals', frequency: 'weekdays' as HabitFrequency, effortLevel: 'medium' as EffortLevel },
    ],
  },
  {
    match: ['focus', 'focused', 'phone', 'scroll', 'scrolling', 'distract', 'distracted', 'attention', 'screen', 'social media'],
    name: 'Focused Me',
    icon: '🎯',
    accent: 'blue' as IdentityAccent,
    description: 'Create deeper attention and less distraction.',
    starts: [
      { name: 'One phone-free hour', target: 60, unit: 'min', frequency: 'weekdays' as HabitFrequency, effortLevel: 'medium' as EffortLevel },
      { name: 'Start the day on one thing', target: 25, unit: 'min', frequency: 'weekdays' as HabitFrequency, effortLevel: 'medium' as EffortLevel },
      { name: 'Phone charges outside the bedroom', target: 1, unit: 'nights', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
      { name: 'Close the extra tabs', target: 1, unit: 'moments', frequency: 'weekdays' as HabitFrequency, effortLevel: 'low' as EffortLevel },
    ],
  },
] as const

const GROWING_ME = {
  name: 'Growing Me',
  icon: '✨',
  accent: 'indigo' as IdentityAccent,
  description: 'Become a little more like the person you described.',
  starts: [
    { name: 'Five minutes toward it', target: 5, unit: 'min', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
    { name: 'Write one line about today', target: 1, unit: 'notes', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
    { name: 'Keep one small promise to yourself', target: 1, unit: 'promises', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
    { name: 'Notice one thing that went right', target: 1, unit: 'notes', frequency: 'daily' as HabitFrequency, effortLevel: 'low' as EffortLevel },
  ],
} as const

/**
 * Turns a free-text description into a named identity with three small starts.
 * Deterministic on purpose: the same text always reads the same way.
 */
export function deriveCustomIdentity(text: string): CustomIdentityDraft {
  const normalized = text.toLowerCase()
  const shape =
    CUSTOM_IDENTITY_SHAPES.find((candidate) =>
      candidate.match.some((keyword) => normalized.includes(keyword))
    ) ?? GROWING_ME

  const identity = {
    slug: CUSTOM_IDENTITY_SLUG,
    name: shape.name,
    accent: shape.accent,
  }

  return {
    slug: CUSTOM_IDENTITY_SLUG,
    name: shape.name,
    icon: shape.icon,
    accent: shape.accent,
    description: shape.description,
    starts: shape.starts.map((seed) => toSuggestion({ ...seed }, identity)),
  }
}
