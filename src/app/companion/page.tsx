'use client'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowUp, Check, Settings2 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { CompanionMessage } from '@/components/companion/companion-message'
import { CompanionOrb } from '@/components/companion/companion-orb'
import { CompanionStylePicker } from '@/components/companion/companion-style-picker'
import { SuggestedActionCard } from '@/components/companion/suggested-action-card'
import { SuggestedPrompt } from '@/components/companion/suggested-prompt'
import { TypingIndicator } from '@/components/companion/typing-indicator'
import { UserMessage } from '@/components/companion/user-message'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getMessages, sendMessage } from '@/lib/api/companion'
import { COMPANION_STYLES } from '@/lib/constants'
import { useCompanionStore } from '@/store/companion-store'
import { CompanionStyle, Message } from '@/types'

const EMPTY_STATE_PROMPTS = [
  "I don't feel like doing anything today.",
  "I'm proud of myself.",
  'I feel lonely.',
  'Why do I keep stopping?',
  'Help me make today easier.',
  'What have you noticed about me?',
] as const

const COMPOSER_MAX_HEIGHT = 128

/** What the user decided about a suggested action, keyed by the message that carried it. */
type ActionOutcome = 'accepted' | 'adjusted' | 'dismissed'

let localMessageCount = 0
function createLocalMessageId(): string {
  localMessageCount += 1
  return `msg_local_${Date.now()}_${localMessageCount}`
}

// Reports false while rendering on the server and during hydration, then true.
const subscribeToNothing = () => () => {}
const getHydratedSnapshot = () => true
const getServerSnapshot = () => false

export default function CompanionPage() {
  const conversationId = useCompanionStore((s) => s.activeConversationId)
  const companionStyle = useCompanionStore((s) => s.companionStyle)
  const setCompanionStyle = useCompanionStore((s) => s.setCompanionStyle)
  const messages = useCompanionStore((s) => s.messages)
  const setMessages = useCompanionStore((s) => s.setMessages)
  const addMessage = useCompanionStore((s) => s.addMessage)
  const draft = useCompanionStore((s) => s.draft)
  const setDraft = useCompanionStore((s) => s.setDraft)
  const isTyping = useCompanionStore((s) => s.isTyping)
  const setIsTyping = useCompanionStore((s) => s.setIsTyping)

  const [isLoading, setIsLoading] = useState(
    () => useCompanionStore.getState().messages.length === 0
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [actionOutcomes, setActionOutcomes] = useState<Record<string, ActionOutcome>>({})

  // The style is persisted to localStorage, so the first client render has to
  // match the server's default before we switch to the stored value.
  const hasHydrated = useSyncExternalStore(subscribeToNothing, getHydratedSnapshot, getServerSnapshot)
  const style: CompanionStyle = hasHydrated ? companionStyle : 'warm_friend'

  const bottomRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // Seed the thread on mount. Coming back to the screen mid-conversation, the
  // store already holds this conversation, so we keep what is already there.
  useEffect(() => {
    const existing = useCompanionStore.getState().messages
    if (existing.length > 0 && existing[0].conversationId === conversationId) return

    let active = true
    getMessages(conversationId)
      .then((seeded) => {
        if (active) setMessages(seeded)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [conversationId, setMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, isTyping])

  // Grow the composer with its content, up to a cap.
  useEffect(() => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`
  }, [draft])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || useCompanionStore.getState().isTyping) return

      const userMessage: Message = {
        id: createLocalMessageId(),
        conversationId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }

      addMessage(userMessage)
      setDraft('')
      setIsTyping(true)

      try {
        const reply = await sendMessage(conversationId, content, useCompanionStore.getState().companionStyle)
        setIsTyping(false)
        addMessage(reply)
      } catch {
        setIsTyping(false)
        addMessage({
          id: createLocalMessageId(),
          conversationId,
          role: 'companion',
          content: "Something went wrong on my end, and I didn't catch that. Want to try again?",
          createdAt: new Date().toISOString(),
        })
      }
    },
    [addMessage, conversationId, setDraft, setIsTyping]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void send(draft)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send(draft)
    }
  }

  const resolveAction = (messageId: string, outcome: ActionOutcome) => {
    setActionOutcomes((prev) => ({ ...prev, [messageId]: outcome }))
  }

  const canSend = draft.trim().length > 0 && !isTyping
  const styleLabel = COMPANION_STYLES[style].label
  const showEmptyState = !isLoading && messages.length === 0

  return (
    <AppShell className="pb-0 md:pb-0">
      <div className="flex h-[100dvh] flex-col md:h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 shrink-0 px-5 pt-5">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-3xl border border-border bg-card p-4">
            <CompanionOrb style={style} size="md" />

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className="font-medium leading-tight">Becoming</p>
                <p className="truncate text-xs text-muted-foreground">{styleLabel}</p>
              </div>
              <p className="text-xs text-muted-foreground">Here with you</p>
            </div>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Companion settings">
                  <Settings2 className="h-5 w-5" aria-hidden="true" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How should I sound?</DialogTitle>
                  <DialogDescription>
                    This changes the tone of everything I say. You can switch any time.
                  </DialogDescription>
                </DialogHeader>
                <CompanionStylePicker value={style} onChange={setCompanionStyle} />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Thread */}
        <div
          className="flex-1 overflow-y-auto px-5 py-6"
          role="log"
          aria-live="polite"
          aria-label="Conversation with Becoming"
          aria-busy={isTyping}
        >
          <div className="mx-auto w-full max-w-2xl space-y-4">
            {isLoading && (
              <div className="space-y-4" aria-hidden="true">
                <Skeleton className="h-16 w-3/4 rounded-3xl" />
                <Skeleton className="ml-auto h-12 w-1/2 rounded-3xl" />
              </div>
            )}

            {showEmptyState && (
              <div className="flex flex-col items-center gap-6 py-16 text-center">
                <CompanionOrb style={style} size="lg" />
                <h1 className="text-xl font-medium">What&rsquo;s on your mind?</h1>
                <div className="flex flex-wrap justify-center gap-2">
                  {EMPTY_STATE_PROMPTS.map((prompt) => (
                    <SuggestedPrompt
                      key={prompt}
                      text={prompt}
                      onClick={() => void send(prompt)}
                      disabled={isTyping}
                    />
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              if (message.role === 'user') {
                return <UserMessage key={message.id} message={message} />
              }

              const outcome = actionOutcomes[message.id]
              // A crisis message owns its own call to action inside the safety
              // card, so we deliberately don't offer chat pills alongside it.
              const quickReplies =
                message.safetyState === 'crisis' ? undefined : message.quickReplies

              return (
                <div key={message.id} className="space-y-3">
                  <CompanionMessage message={message} style={style} />

                  {quickReplies && quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-11">
                      {quickReplies.map((reply, index) => (
                        <SuggestedPrompt
                          key={`${message.id}-${index}`}
                          text={reply}
                          onClick={() => void send(reply)}
                          disabled={isTyping}
                        />
                      ))}
                    </div>
                  )}

                  {message.suggestedAction && outcome !== 'dismissed' && outcome !== 'adjusted' && (
                    <div className="pl-11">
                      {outcome === 'accepted' ? (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
                          Added. You can change it any time.
                        </p>
                      ) : (
                        <SuggestedActionCard
                          action={message.suggestedAction}
                          onAccept={() => resolveAction(message.id, 'accepted')}
                          onAdjust={() => {
                            if (isTyping) return
                            resolveAction(message.id, 'adjusted')
                            void send("Let's adjust it.")
                          }}
                          onDismiss={() => resolveAction(message.id, 'dismissed')}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {isTyping && <TypingIndicator style={style} />}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 px-5 pb-28 pt-2 md:pb-6">
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
            <label htmlFor="companion-composer" className="sr-only">
              Message Becoming
            </label>
            <div className="flex items-end gap-2 rounded-full border border-border bg-card py-2 pl-5 pr-2">
              <textarea
                id="companion-composer"
                ref={composerRef}
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Say anything&hellip;"
                className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white transition-all hover:bg-violet-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
