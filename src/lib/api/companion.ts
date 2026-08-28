import { Conversation, Message, CompanionStyle } from '@/types'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/data/seed'
import { sleep } from '@/lib/utils'
import { mockFetch } from './mock-client'

type CompanionResponse = {
  content: string
  quickReplies?: string[]
  suggestedAction?: Message['suggestedAction']
  safetyState?: Message['safetyState']
}

const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'self-harm',
  'self harm',
  'hurt myself',
  'end it all',
  'not worth living',
  'want to die',
]
const LONELY_KEYWORDS = ['lonely', 'alone', 'isolated', 'no one cares', 'nobody']
const PROUD_KEYWORDS = ['proud', 'did it', 'accomplished', 'finished', 'completed']
const STUCK_KEYWORDS = ['stuck', "can't", 'cant', 'failing', 'give up', 'hopeless', 'quitting', 'keep stopping']
const EASIER_KEYWORDS = ['easier', 'lighter', 'gentle', 'tired', 'exhausted', "don't feel like"]
const NOTICED_KEYWORDS = ['noticed', 'pattern', 'about me', 'what do you see']

type Category = 'crisis' | 'lonely' | 'proud' | 'stuck' | 'easier' | 'noticed' | 'general'

function detectCategory(input: string): Category {
  const lower = input.toLowerCase()
  if (CRISIS_KEYWORDS.some((k) => lower.includes(k))) return 'crisis'
  if (LONELY_KEYWORDS.some((k) => lower.includes(k))) return 'lonely'
  if (PROUD_KEYWORDS.some((k) => lower.includes(k))) return 'proud'
  if (NOTICED_KEYWORDS.some((k) => lower.includes(k))) return 'noticed'
  if (STUCK_KEYWORDS.some((k) => lower.includes(k))) return 'stuck'
  if (EASIER_KEYWORDS.some((k) => lower.includes(k))) return 'easier'
  return 'general'
}

const RESPONSES: Record<Category, Record<CompanionStyle, CompanionResponse>> = {
  crisis: {
    warm_friend: {
      content:
        "I hear you, and I'm glad you told me. What you're feeling matters, and you shouldn't have to carry it alone. Please reach out to someone who can really be with you right now — a person you trust, or a crisis line. You deserve that kind of care.",
      safetyState: 'crisis',
      quickReplies: ['Get support'],
    },
    calm_coach: {
      content:
        "Thank you for saying that out loud. This is beyond what I can support well — I'm a growth companion, not a professional. Please connect with a mental health professional or a crisis resource. That's the right next step here.",
      safetyState: 'crisis',
      quickReplies: ['Get support'],
    },
    gentle_guide: {
      content:
        "Thank you for trusting me with this. I want you to be somewhere safe and supported. Please reach out to someone who can truly be there — a friend, a family member, or a professional. You don't have to go through this alone.",
      safetyState: 'crisis',
      quickReplies: ['Get support'],
    },
    direct_motivator: {
      content:
        "This matters more than anything else we could work on. Please reach out to a mental health professional or a crisis line now. Asking for support is the strongest thing you can do right now.",
      safetyState: 'crisis',
      quickReplies: ['Get support'],
    },
  },
  lonely: {
    warm_friend: {
      content:
        'That sounds heavy. Do you want to talk about what today has felt like, or would it help to think about one small way to feel more connected?',
      quickReplies: ['Talk about it', 'Give me something small to try'],
    },
    calm_coach: {
      content:
        'Loneliness is worth listening to. What feels like it is missing — depth, frequency, or something harder to name?',
      quickReplies: ['Depth', 'Just more contact', "I'm not sure"],
    },
    gentle_guide: {
      content:
        "I hear you, and it makes sense to feel that way. Is there anyone who comes to mind — even someone you've been meaning to reach out to?",
      quickReplies: ['Yes, someone', 'Not really', 'I want to talk'],
    },
    direct_motivator: {
      content:
        "Feeling isolated is hard, and it usually shifts with one real connection. Who's one person you could message today?",
      quickReplies: ['I have someone in mind', "I'm not sure", "Let's talk about it"],
    },
  },
  proud: {
    warm_friend: {
      content:
        "You should be. That wasn't nothing — you showed up and followed through. What made it click today?",
      quickReplies: ['I just decided to', 'The routine helped', "I'm not sure"],
    },
    calm_coach: {
      content: 'That is worth noting. What do you think made the difference this time?',
      quickReplies: ['Consistency', 'Motivation', 'Something shifted'],
    },
    gentle_guide: {
      content: "That's genuinely wonderful. Take a moment with that feeling — it's yours.",
      quickReplies: ['Thank you', "What's next?"],
    },
    direct_motivator: {
      content: "That's the mindset. You did the work. Let's use that momentum.",
      quickReplies: ["What's next?", "Let's build on it"],
    },
  },
  stuck: {
    warm_friend: {
      content:
        "That stuck feeling is really common, and it doesn't mean anything is broken. What feels heaviest right now — the habit itself, or something around it?",
      quickReplies: ['The habit', 'Everything feels heavy', "I'm not sure"],
    },
    calm_coach: {
      content:
        'When resistance shows up repeatedly, it is usually worth asking whether the target still fits. Would making it smaller feel like giving up, or like giving yourself room?',
      quickReplies: ['Like giving up', 'Like room to breathe', "I'm not sure"],
    },
    gentle_guide: {
      content:
        "It's okay to pause. There's no shame in a slower pace. What would feel manageable today — even something tiny?",
      quickReplies: ['Something tiny', 'I need a break', "Let's talk"],
    },
    direct_motivator: {
      content: "Stuck means you haven't quit. What's one small thing you can do in the next ten minutes?",
      quickReplies: ['Start small', 'Give me a push', 'Something different'],
    },
  },
  easier: {
    warm_friend: {
      content:
        'Totally okay to want a lighter day. Want me to help you think about what a gentle version of today could look like?',
      quickReplies: ['Yes please', 'Just a small adjustment', 'I need to skip today'],
    },
    calm_coach: {
      content: 'Ease has a place in any sustainable pattern. What feels like the right level of effort today?',
      quickReplies: ['Very light', 'A little lighter', "Actually I'm fine"],
    },
    gentle_guide: {
      content: "Let's make today work for where you actually are. What would feel like enough?",
      quickReplies: ['Just one thing', 'Something small', 'I need to rest'],
    },
    direct_motivator: {
      content: "A light day is still forward motion. What's the one thing worth doing?",
      quickReplies: ['The easiest one', 'Meditation', 'The walk'],
    },
  },
  noticed: {
    warm_friend: {
      content:
        "You come back. That's the thing I notice most. You've had pauses, and every single time you started again without making it a big deal. Your mornings are also quietly becoming your strongest part of the day.",
      quickReplies: ['Tell me more', "What should I focus on?"],
    },
    calm_coach: {
      content:
        'Two patterns stand out. Your completion rate is meaningfully higher on days you move before nine in the morning. And meditation has shifted from stretch to easy over the last three weeks.',
      quickReplies: ['What does that suggest?', 'Show me the map'],
    },
    gentle_guide: {
      content:
        "You're gentler with yourself than you were four months ago. The pauses used to turn into long gaps. Now they last a day or two, and you return.",
      quickReplies: ['That helps to hear', 'What else?'],
    },
    direct_motivator: {
      content:
        'Your morning walks drive everything else. On walk days you finish 87% of your habits. On non-walk days, 61%. That is your lever.',
      quickReplies: ['How do I use that?', 'Show me the map'],
    },
  },
  general: {
    warm_friend: {
      content: "I'm here. What's on your mind?",
      quickReplies: ['I want to reflect', 'I need encouragement', 'What have you noticed about me?'],
    },
    calm_coach: {
      content: 'What would be most useful to explore right now?',
      quickReplies: ['My patterns', 'My progress', 'What to focus on'],
    },
    gentle_guide: {
      content: 'No rush. What feels most present for you right now?',
      quickReplies: ['How I am feeling', 'My habits', 'Something specific'],
    },
    direct_motivator: {
      content: 'What are we working on?',
      quickReplies: ['My habits', "Today's plan", 'Something challenging me'],
    },
  },
}

const CONNECTION_FOLLOWUP: CompanionResponse = {
  content:
    'One gentle experiment could be reaching out to one person every few days — not a big social goal, just creating more openings for connection. Sometimes a short message is enough to remind someone they matter to you.',
  suggestedAction: {
    type: 'create_habit',
    label: 'Turn this into a habit',
    payload: { name: 'Reach out to someone', cadence: 'Once every 3 days', identityId: 'id_social' },
  },
}

export async function getConversations(): Promise<Conversation[]> {
  return mockFetch(MOCK_CONVERSATIONS, 400)
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return mockFetch(
    MOCK_MESSAGES.filter((m) => m.conversationId === conversationId),
    500,
  )
}

export async function sendMessage(
  conversationId: string,
  content: string,
  style: CompanionStyle,
): Promise<Message> {
  await sleep(700 + Math.random() * 500)

  const lower = content.toLowerCase()
  const wantsSmallAction = lower.includes('something small') || lower.includes('small to try')
  const response = wantsSmallAction ? CONNECTION_FOLLOWUP : RESPONSES[detectCategory(content)][style]

  return {
    id: `msg_${Date.now()}`,
    conversationId,
    role: 'companion',
    content: response.content,
    createdAt: new Date().toISOString(),
    quickReplies: response.quickReplies,
    suggestedAction: response.suggestedAction,
    safetyState: response.safetyState,
  }
}
