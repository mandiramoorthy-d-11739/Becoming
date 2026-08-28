import { User, Identity, Habit, HabitCheckin, Progression, PersonalChallenge, MoodCheckin, Reflection, Conversation, Message, Insight, BecomingMapDay } from '@/types'

export const MOCK_USER: User = {
  id: 'user_maya',
  name: 'Maya Rao',
  firstName: 'Maya',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b332c3c5?w=200&h=200&fit=crop&crop=face',
  timezone: 'America/New_York',
  locale: 'en-US',
  onboardingCompleted: true,
  companionStyle: 'warm_friend',
  createdAt: '2025-05-01T09:00:00Z',
}

export const MOCK_IDENTITIES: Identity[] = [
  {
    id: 'id_calmer',
    userId: 'user_maya',
    name: 'Calmer Me',
    slug: 'calmer',
    description: 'Building more space between me and the noise.',
    icon: '🧘',
    accent: 'violet',
    status: 'active',
    createdAt: '2025-05-01T09:00:00Z',
  },
  {
    id: 'id_healthier',
    userId: 'user_maya',
    name: 'Healthier Me',
    slug: 'healthier',
    description: 'Taking care of the body that carries me.',
    icon: '🌱',
    accent: 'green',
    status: 'active',
    createdAt: '2025-05-01T09:00:00Z',
  },
  {
    id: 'id_social',
    userId: 'user_maya',
    name: 'More Social Me',
    slug: 'social',
    description: 'Creating more openings for real connection.',
    icon: '🤝',
    accent: 'rose',
    status: 'active',
    createdAt: '2025-05-15T09:00:00Z',
  },
]

export const MOCK_HABITS: Habit[] = [
  {
    id: 'habit_meditate',
    userId: 'user_maya',
    identityId: 'id_calmer',
    name: 'Meditate',
    description: 'A few minutes of stillness to start the day.',
    type: 'duration',
    unit: 'minutes',
    currentTarget: 3,
    schedule: { frequency: 'daily', reminderTime: '07:30' },
    effortLevel: 'low',
    status: 'active',
    createdAt: '2025-05-01T09:00:00Z',
    updatedAt: '2025-07-15T09:00:00Z',
  },
  {
    id: 'habit_walk',
    userId: 'user_maya',
    identityId: 'id_healthier',
    name: 'Morning Walk',
    description: 'Move the body before the day takes over.',
    type: 'duration',
    unit: 'minutes',
    currentTarget: 20,
    schedule: { frequency: 'weekdays', reminderTime: '07:00' },
    effortLevel: 'medium',
    status: 'active',
    createdAt: '2025-05-01T09:00:00Z',
    updatedAt: '2025-06-20T09:00:00Z',
  },
  {
    id: 'habit_water',
    userId: 'user_maya',
    identityId: 'id_healthier',
    name: 'Drink Water',
    description: 'Stay hydrated throughout the day.',
    type: 'quantity',
    unit: 'L',
    currentTarget: 2,
    schedule: { frequency: 'daily' },
    effortLevel: 'low',
    status: 'active',
    createdAt: '2025-05-08T09:00:00Z',
    updatedAt: '2025-05-08T09:00:00Z',
  },
  {
    id: 'habit_reach_out',
    userId: 'user_maya',
    identityId: 'id_social',
    name: 'Reach Out',
    description: 'Send a message, make a call, or make plans.',
    type: 'binary',
    currentTarget: 1,
    schedule: { frequency: 'custom', daysOfWeek: [1, 4, 7] },
    effortLevel: 'low',
    status: 'active',
    createdAt: '2025-05-15T09:00:00Z',
    updatedAt: '2025-05-15T09:00:00Z',
  },
  {
    id: 'habit_scrolling',
    userId: 'user_maya',
    identityId: 'id_calmer',
    name: 'Reduce Late-Night Scrolling',
    description: 'Limit phone use after 10:30pm to under 20 minutes.',
    type: 'reduction',
    unit: 'minutes',
    currentTarget: 20,
    schedule: { frequency: 'daily' },
    effortLevel: 'medium',
    status: 'active',
    createdAt: '2025-05-10T09:00:00Z',
    updatedAt: '2025-05-10T09:00:00Z',
  },
]

// Helper to generate date string N days ago
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function dateStr(n: number): string { return daysAgo(n) }

// Generate 120 days of realistic checkin data
function generateCheckins(): HabitCheckin[] {
  const checkins: HabitCheckin[] = []
  let id = 1

  // Meditation checkins - started at 2min, progressed to 3min at day 60
  // Pattern: mostly complete, some skipped, realistic gaps
  const meditateTarget = (dayAgo: number) => dayAgo > 45 ? 2 : 3
  const meditateSkipDays = new Set([2, 5, 18, 19, 20, 35, 47, 62, 78, 90, 91, 105])
  const meditatePartialDays = new Set([8, 25, 41, 55, 70, 85])

  for (let i = 0; i < 120; i++) {
    const target = meditateTarget(i)
    if (meditateSkipDays.has(i)) {
      checkins.push({ id: `chk_${id++}`, habitId: 'habit_meditate', userId: 'user_maya', date: dateStr(i), status: 'skipped', targetValue: target, createdAt: `${dateStr(i)}T07:35:00Z` })
    } else if (meditatePartialDays.has(i)) {
      checkins.push({ id: `chk_${id++}`, habitId: 'habit_meditate', userId: 'user_maya', date: dateStr(i), status: 'partial', actualValue: 1, targetValue: target, comfortRating: 'easy', createdAt: `${dateStr(i)}T07:35:00Z` })
    } else {
      const comfort = i < 15 ? 'stretch' : i < 40 ? 'right' : 'easy'
      checkins.push({ id: `chk_${id++}`, habitId: 'habit_meditate', userId: 'user_maya', date: dateStr(i), status: 'complete', actualValue: target, targetValue: target, comfortRating: comfort as any, note: i === 30 ? 'Finally starting to feel natural.' : undefined, createdAt: `${dateStr(i)}T07:35:00Z` })
    }
  }

  // Morning walk - weekdays mostly, started 10min → 15min → 20min
  const walkTarget = (i: number) => i > 80 ? 10 : i > 45 ? 15 : 20
  const walkSkipDays = new Set([1, 6, 7, 13, 14, 20, 21, 27, 28, 33, 34, 40, 41, 46, 47, 50, 53, 54, 60, 61, 67, 68, 74, 75, 80, 81, 87, 88, 94, 95, 100, 101, 107, 108, 114, 115])

  for (let i = 0; i < 120; i++) {
    const isWeekend = walkSkipDays.has(i)
    if (isWeekend) continue
    const target = walkTarget(i)
    const skippedRandomly = [3, 16, 31, 58, 72, 89, 102].includes(i)
    if (skippedRandomly) {
      checkins.push({ id: `chk_${id++}`, habitId: 'habit_walk', userId: 'user_maya', date: dateStr(i), status: 'skipped', targetValue: target, createdAt: `${dateStr(i)}T07:05:00Z` })
    } else {
      checkins.push({ id: `chk_${id++}`, habitId: 'habit_walk', userId: 'user_maya', date: dateStr(i), status: 'complete', actualValue: target, targetValue: target, comfortRating: target === 10 ? 'easy' : 'right', createdAt: `${dateStr(i)}T07:05:00Z` })
    }
  }

  // Water habit
  const waterSkips = new Set([4, 11, 24, 38, 52, 65, 79, 93])
  for (let i = 0; i < 112; i++) {
    if (waterSkips.has(i)) continue
    const partial = [7, 15, 28, 42, 55, 68, 82].includes(i)
    checkins.push({ id: `chk_${id++}`, habitId: 'habit_water', userId: 'user_maya', date: dateStr(i), status: partial ? 'partial' : 'complete', actualValue: partial ? 1.2 : 2, targetValue: 2, createdAt: `${dateStr(i)}T20:00:00Z` })
  }

  // Reach out (every 3 days roughly)
  for (let i = 0; i < 105; i += 3) {
    const skipped = [6, 18, 42, 66, 90].includes(i)
    checkins.push({ id: `chk_${id++}`, habitId: 'habit_reach_out', userId: 'user_maya', date: dateStr(i), status: skipped ? 'skipped' : 'complete', targetValue: 1, createdAt: `${dateStr(i)}T14:00:00Z` })
  }

  // Late-night scrolling reduction
  const scrollingSkips = new Set([3, 10, 17, 24, 31, 38, 45, 52, 59, 66])
  for (let i = 0; i < 110; i++) {
    if (scrollingSkips.has(i)) continue
    const exceeded = [5, 13, 22, 36, 49, 63, 77].includes(i)
    checkins.push({ id: `chk_${id++}`, habitId: 'habit_scrolling', userId: 'user_maya', date: dateStr(i), status: exceeded ? 'partial' : 'complete', actualValue: exceeded ? 35 : Math.floor(Math.random() * 18) + 2, targetValue: 20, createdAt: `${dateStr(i)}T23:00:00Z` })
  }

  return checkins
}

export const MOCK_CHECKINS: HabitCheckin[] = generateCheckins()

export const MOCK_PROGRESSIONS: Progression[] = [
  {
    id: 'prog_1',
    habitId: 'habit_meditate',
    previousTarget: 2,
    proposedTarget: 3,
    acceptedTarget: 2,
    source: 'companion',
    reason: "You've meditated for 2 minutes on 12 of the last 14 days, and it's usually felt comfortable.",
    experimentDurationDays: 4,
    startedAt: daysAgo(60),
    endedAt: daysAgo(56),
    outcome: 'reverted',
    userFeedback: 'too_much',
  },
  {
    id: 'prog_2',
    habitId: 'habit_meditate',
    previousTarget: 2,
    proposedTarget: 3,
    acceptedTarget: 3,
    source: 'companion',
    reason: 'You came back to this experiment and it felt easier this time.',
    experimentDurationDays: 4,
    startedAt: daysAgo(48),
    endedAt: daysAgo(44),
    outcome: 'kept',
    userFeedback: 'about_right',
  },
  {
    id: 'prog_3',
    habitId: 'habit_walk',
    previousTarget: 10,
    proposedTarget: 15,
    acceptedTarget: 15,
    source: 'user',
    reason: '10 minutes felt too easy, wanted to move more.',
    experimentDurationDays: 7,
    startedAt: daysAgo(85),
    endedAt: daysAgo(78),
    outcome: 'kept',
    userFeedback: 'about_right',
  },
  {
    id: 'prog_4',
    habitId: 'habit_walk',
    previousTarget: 15,
    proposedTarget: 20,
    acceptedTarget: 20,
    source: 'companion',
    reason: "Your walks have been consistently comfortable. 20 minutes could be a natural next step.",
    experimentDurationDays: 7,
    startedAt: daysAgo(48),
    endedAt: daysAgo(41),
    outcome: 'kept',
    userFeedback: 'about_right',
  },
]

export const MOCK_CHALLENGES: PersonalChallenge[] = [
  {
    id: 'challenge_1',
    userId: 'user_maya',
    habitId: 'habit_meditate',
    title: 'See what calm feels like without watching the clock.',
    description: "You've been meditating for 2 minutes. Today, want to see how long you naturally stay focused?",
    challengeType: 'open_ended',
    proposedAt: daysAgo(55),
    acceptedAt: daysAgo(55),
    completedAt: daysAgo(55),
    resultValue: 4,
    resultUnit: 'minutes',
    reflection: 'Surprisingly comfortable. I lost track of time in a good way.',
    status: 'completed',
  },
  {
    id: 'challenge_2',
    userId: 'user_maya',
    habitId: 'habit_walk',
    title: 'Walk before 8am for 5 days.',
    description: "You tend to have better days when you move early. Want to see what a week of early walks feels like?",
    challengeType: 'consistency',
    proposedAt: daysAgo(3),
    status: 'proposed',
  },
]

export const MOCK_MOODS: MoodCheckin[] = [
  ...Array.from({ length: 90 }, (_, i) => {
    const moods: Array<'light' | 'balanced' | 'effortful' | 'hard'> = ['light', 'balanced', 'effortful', 'hard']
    const weights = [0.25, 0.45, 0.22, 0.08]
    const rand = Math.abs(Math.sin(i * 7.3))
    let cumulative = 0
    let mood: 'light' | 'balanced' | 'effortful' | 'hard' = 'balanced'
    for (let j = 0; j < weights.length; j++) {
      cumulative += weights[j]
      if (rand < cumulative) { mood = moods[j]; break }
    }
    const energies: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high']
    const energy = energies[Math.floor(Math.abs(Math.sin(i * 3.7)) * 3)]
    return {
      id: `mood_${i}`,
      userId: 'user_maya',
      date: dateStr(i),
      mood,
      energy,
      createdAt: `${dateStr(i)}T08:00:00Z`,
    }
  })
]

export const MOCK_REFLECTIONS: Reflection[] = [
  {
    id: 'ref_1',
    userId: 'user_maya',
    habitId: 'habit_meditate',
    date: dateStr(55),
    prompt: 'How did that feel?',
    response: "I stayed with it for over 4 minutes. Honestly surprised myself. It felt different without the timer pressure.",
    sentimentLabel: 'positive',
    createdAt: `${dateStr(55)}T07:40:00Z`,
  },
  {
    id: 'ref_2',
    userId: 'user_maya',
    date: dateStr(30),
    prompt: 'What felt good this week?',
    response: "Getting outside before the laptop opened. Morning walks are starting to feel like mine, not a task.",
    sentimentLabel: 'positive',
    createdAt: `${dateStr(30)}T21:00:00Z`,
  },
  {
    id: 'ref_3',
    userId: 'user_maya',
    date: dateStr(19),
    prompt: 'How did today feel?',
    response: "Skipped meditation. Just couldn't make myself sit still. Feeling a bit off.",
    sentimentLabel: 'challenging',
    createdAt: `${dateStr(19)}T22:00:00Z`,
  },
  {
    id: 'ref_4',
    userId: 'user_maya',
    identityId: 'id_healthier',
    date: dateStr(14),
    prompt: 'What have you noticed?',
    response: "I feel better on days I walk. It's becoming obvious now. The correlation is real.",
    sentimentLabel: 'positive',
    createdAt: `${dateStr(14)}T20:30:00Z`,
  },
  {
    id: 'ref_5',
    userId: 'user_maya',
    date: dateStr(7),
    prompt: 'What felt difficult this week?',
    response: "The scrolling at night. I know it's not helping me sleep but it feels like the only decompression I have right now.",
    sentimentLabel: 'challenging',
    createdAt: `${dateStr(7)}T21:30:00Z`,
  },
]

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    userId: 'user_maya',
    title: 'Feeling stuck',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
    lastMessage: "That makes a lot of sense. Let's think about one small thing.",
  },
  {
    id: 'conv_2',
    userId: 'user_maya',
    title: 'Morning check-in',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    lastMessage: "You've been building something real.",
  },
]

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    role: 'user',
    content: "I feel lonely.",
    createdAt: `${daysAgo(12)}T14:00:00Z`,
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    role: 'companion',
    content: "That sounds heavy. Do you want to talk about what today has felt like, or would it help to think about one small way to feel more connected?",
    createdAt: `${daysAgo(12)}T14:00:30Z`,
    quickReplies: ["Talk about it", "Give me something small to try"],
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    role: 'user',
    content: "Give me something small to try.",
    createdAt: `${daysAgo(12)}T14:01:00Z`,
  },
  {
    id: 'msg_4',
    conversationId: 'conv_1',
    role: 'companion',
    content: "One gentle experiment could be reaching out to one person every few days — not a big social goal, just creating more openings for connection. Sometimes a short message is enough to remind someone they matter to you.",
    createdAt: `${daysAgo(12)}T14:01:30Z`,
    suggestedAction: {
      type: 'create_habit',
      label: 'Turn this into a habit',
      payload: { name: 'Reach Out', identityId: 'id_social' },
    },
  },
]

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: 'insight_1',
    userId: 'user_maya',
    type: 'correlation',
    title: 'Your walks change more than your step count',
    summary: "On mornings you walk before 9am, you complete more of your planned habits later in the day.",
    evidence: "Over the last 30 days, you completed 87% of your other habits on walk days vs. 61% on non-walk days.",
    relatedHabitIds: ['habit_walk'],
    relatedIdentityIds: ['id_healthier'],
    createdAt: daysAgo(5),
    status: 'unread',
  },
  {
    id: 'insight_2',
    userId: 'user_maya',
    type: 'pattern',
    title: 'Meditation is becoming easier',
    summary: "Your comfort rating shifted from 'Stretch' to 'Right' over the last 3 weeks.",
    evidence: "You rated meditation 'Easy' or 'Right' 11 of the last 14 times. Three weeks ago that was 3 of 7.",
    relatedHabitIds: ['habit_meditate'],
    relatedIdentityIds: ['id_calmer'],
    createdAt: daysAgo(3),
    status: 'unread',
  },
  {
    id: 'insight_3',
    userId: 'user_maya',
    type: 'suggestion',
    title: 'Sundays need a gentler plan',
    summary: "Your Sunday completion rate is lower, but your reflection scores are better when you plan fewer habits.",
    evidence: "Sunday habit completion: 42%. Sunday reflection quality (self-reported): highest of the week.",
    relatedHabitIds: ['habit_walk', 'habit_meditate'],
    relatedIdentityIds: ['id_calmer', 'id_healthier'],
    createdAt: daysAgo(8),
    status: 'read',
  },
  {
    id: 'insight_4',
    userId: 'user_maya',
    type: 'milestone',
    title: "Calm is becoming familiar",
    summary: "You've shown up for Calmer Me on 30 different days.",
    evidence: "30 days of meditation and/or scrolling reduction since you began Calmer Me.",
    relatedHabitIds: ['habit_meditate', 'habit_scrolling'],
    relatedIdentityIds: ['id_calmer'],
    createdAt: daysAgo(15),
    status: 'saved',
  },
]

// Generate map data
function generateMapData(): BecomingMapDay[] {
  const days: BecomingMapDay[] = []
  for (let i = 119; i >= 0; i--) {
    const date = dateStr(i)
    const dayCheckins = MOCK_CHECKINS.filter(c => c.date === date)
    const completedHabitIds = dayCheckins.filter(c => c.status === 'complete').map(c => c.habitId)
    const identityIds = [...new Set(completedHabitIds.map(hid => {
      const habit = MOCK_HABITS.find(h => h.id === hid)
      return habit?.identityId ?? ''
    }).filter(Boolean))]
    const score = Math.min(completedHabitIds.length / 3, 1)
    let intensity: 0 | 1 | 2 | 3 | 4 = 0
    if (completedHabitIds.length === 0) intensity = 0
    else if (completedHabitIds.length === 1) intensity = 1
    else if (completedHabitIds.length === 2) intensity = 2
    else if (completedHabitIds.length === 3) intensity = 3
    else intensity = 4

    const mood = MOCK_MOODS.find(m => m.date === date)
    const reflection = MOCK_REFLECTIONS.find(r => r.date === date)
    const milestoneCount = i === 30 || i === 60 || i === 90 ? 1 : 0

    const summaries = [
      'A gentle day. Small steps, real progress.',
      'Showed up despite not feeling like it.',
      'Strong morning set the tone for everything.',
      'Quieter day. Rest is part of the rhythm.',
      'Did the things that matter.',
      'Reconnected with what I\'m building.',
    ]

    days.push({
      date,
      score,
      intensity,
      completedHabitIds,
      identityIds,
      mood: mood?.mood,
      milestoneCount,
      reflectionSnippet: reflection?.response?.slice(0, 80),
      summary: completedHabitIds.length > 0 ? summaries[i % summaries.length] : 'A quieter day.',
    })
  }
  return days
}

export const MOCK_MAP_DATA: BecomingMapDay[] = generateMapData()
