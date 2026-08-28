'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepWelcome } from '@/components/onboarding/step-welcome'
import { StepIdentity } from '@/components/onboarding/step-identity'
import {
  StepCustomIdentity,
  type CustomIdentityPhase,
} from '@/components/onboarding/step-custom-identity'
import { StepHabits } from '@/components/onboarding/step-habits'
import { StepCompanion } from '@/components/onboarding/step-companion'
import { StepReminders } from '@/components/onboarding/step-reminders'
import { StepReady } from '@/components/onboarding/step-ready'
import { useMotionPreference } from '@/components/onboarding/use-motion-preference'
import { useHydrated } from '@/components/onboarding/use-hydrated'
import {
  buildHabitSuggestions,
  deriveCustomIdentity,
  formatTargetLine,
  type CustomIdentityDraft,
  type HabitDraft,
} from '@/components/onboarding/suggestions'
import { COMPANION_STYLES, IDENTITY_OPTIONS } from '@/lib/constants'
import { useOnboardingStore, type OnboardingReminders } from '@/store/onboarding-store'

const TOTAL_STEPS = 7
const PARSE_DELAY_MS = 900
const MIN_CUSTOM_LENGTH = 10

const stepVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -24 }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const reduceMotion = useMotionPreference()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const selectedIdentitySlugs = useOnboardingStore((state) => state.selectedIdentityIds)
  const setSelectedIdentities = useOnboardingStore((state) => state.setSelectedIdentities)
  const customIdentityText = useOnboardingStore((state) => state.customIdentityText)
  const setCustomIdentityText = useOnboardingStore((state) => state.setCustomIdentityText)
  const selectedHabitIds = useOnboardingStore((state) => state.selectedHabitIds)
  const setSelectedHabits = useOnboardingStore((state) => state.setSelectedHabits)
  const companionStyle = useOnboardingStore((state) => state.companionStyle)
  const setCompanionStyle = useOnboardingStore((state) => state.setCompanionStyle)
  const reminders = useOnboardingStore((state) => state.reminders)
  const setReminders = useOnboardingStore((state) => state.setReminders)
  const setCompleted = useOnboardingStore((state) => state.setCompleted)

  // Null until the user edits, so an in-progress description survives a reload.
  const hydrated = useHydrated()
  const [customEdit, setCustomEdit] = useState<string | null>(null)
  const customText = customEdit ?? (hydrated ? customIdentityText : '')

  const [customPhase, setCustomPhase] = useState<CustomIdentityPhase>('idle')
  const [customPreview, setCustomPreview] = useState<CustomIdentityDraft | null>(null)
  const [habitDrafts, setHabitDrafts] = useState<Record<string, HabitDraft>>({})
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)

  const parseTimer = useRef<number | null>(null)
  const hasNavigated = useRef(false)

  // AnimatePresence keeps the outgoing step mounted until it finishes leaving,
  // so focus has to move when the incoming step's node attaches, not on render.
  const focusOnMount = useCallback((node: HTMLDivElement | null) => {
    if (node && hasNavigated.current) node.focus({ preventScroll: true })
  }, [])

  useEffect(() => () => {
    if (parseTimer.current !== null) window.clearTimeout(parseTimer.current)
  }, [])

  const acceptedCustomIdentity = useMemo(
    () => (customIdentityText.trim() ? deriveCustomIdentity(customIdentityText) : null),
    [customIdentityText]
  )

  const habitSuggestions = useMemo(
    () => buildHabitSuggestions(selectedIdentitySlugs, acceptedCustomIdentity),
    [selectedIdentitySlugs, acceptedCustomIdentity]
  )

  // Drop any habits that no longer belong to the chosen directions.
  useEffect(() => {
    const validIds = new Set(habitSuggestions.map((suggestion) => suggestion.id))
    const pruned = selectedHabitIds.filter((id) => validIds.has(id))
    if (pruned.length !== selectedHabitIds.length) setSelectedHabits(pruned)
  }, [habitSuggestions, selectedHabitIds, setSelectedHabits])

  const goToStep = useCallback((next: number) => {
    hasNavigated.current = true
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }, [step])

  const previousStep = useMemo(() => {
    if (step === 3) return customIdentityText.trim() ? 2 : 1
    if (step === 4) return selectedIdentitySlugs.length > 0 || customIdentityText.trim() ? 3 : 0
    return step - 1
  }, [step, customIdentityText, selectedIdentitySlugs])

  const toggleIdentity = useCallback(
    (slug: string) => {
      setSelectedIdentities(
        selectedIdentitySlugs.includes(slug)
          ? selectedIdentitySlugs.filter((existing) => existing !== slug)
          : [...selectedIdentitySlugs, slug]
      )
    },
    [selectedIdentitySlugs, setSelectedIdentities]
  )

  const toggleHabit = useCallback(
    (id: string) => {
      setSelectedHabits(
        selectedHabitIds.includes(id)
          ? selectedHabitIds.filter((existing) => existing !== id)
          : [...selectedHabitIds, id]
      )
    },
    [selectedHabitIds, setSelectedHabits]
  )

  const updateHabitDraft = useCallback(
    (id: string, patch: Partial<HabitDraft>) => {
      const suggestion = habitSuggestions.find((candidate) => candidate.id === id)
      if (!suggestion) return
      setHabitDrafts((current) => {
        const base = current[id] ?? { target: suggestion.target, frequency: suggestion.frequency }
        return { ...current, [id]: { ...base, ...patch } }
      })
    },
    [habitSuggestions]
  )

  const handleCustomTextChange = useCallback((next: string) => {
    setCustomEdit(next)
    if (parseTimer.current !== null) {
      window.clearTimeout(parseTimer.current)
      parseTimer.current = null
    }
    setCustomPhase('idle')
    setCustomPreview(null)
  }, [])

  const readCustomIdentity = useCallback(() => {
    setCustomPhase('reading')
    setCustomPreview(null)
    parseTimer.current = window.setTimeout(() => {
      setCustomPreview(deriveCustomIdentity(customText))
      setCustomPhase('result')
      parseTimer.current = null
    }, PARSE_DELAY_MS)
  }, [customText])

  const handleReminderChange = useCallback(
    (patch: Partial<OnboardingReminders>) => setReminders(patch),
    [setReminders]
  )

  const finish = useCallback(() => {
    setCompleted(true)
    router.push('/today')
  }, [router, setCompleted])

  const identityNames = useMemo(() => {
    const names: string[] = []
    for (const slug of selectedIdentitySlugs) {
      const option = IDENTITY_OPTIONS.find((candidate) => candidate.slug === slug)
      if (option) names.push(option.name)
    }
    if (acceptedCustomIdentity) names.push(acceptedCustomIdentity.name)
    return names
  }, [selectedIdentitySlugs, acceptedCustomIdentity])

  const firstHabitSummary = useMemo(() => {
    const first = habitSuggestions.find((suggestion) => selectedHabitIds.includes(suggestion.id))
    if (!first) return null
    const draft = habitDrafts[first.id] ?? { target: first.target, frequency: first.frequency }
    return `${first.name} — ${formatTargetLine(draft.target, first.unit, draft.frequency)}`
  }, [habitSuggestions, selectedHabitIds, habitDrafts])

  const stepContent = () => {
    switch (step) {
      case 0:
        return <StepWelcome />
      case 1:
        return (
          <StepIdentity
            selectedSlugs={selectedIdentitySlugs}
            onToggle={toggleIdentity}
            onChooseMyOwn={() => goToStep(2)}
          />
        )
      case 2:
        return (
          <StepCustomIdentity
            text={customText}
            onTextChange={handleCustomTextChange}
            phase={customPhase}
            draft={customPreview}
            reduceMotion={reduceMotion}
          />
        )
      case 3:
        return (
          <StepHabits
            suggestions={habitSuggestions}
            selectedIds={selectedHabitIds}
            drafts={habitDrafts}
            editingId={editingHabitId}
            onToggle={toggleHabit}
            onEditToggle={(id) => setEditingHabitId((current) => (current === id ? null : id))}
            onDraftChange={updateHabitDraft}
          />
        )
      case 4:
        return (
          <StepCompanion
            value={companionStyle}
            onChange={setCompanionStyle}
            reduceMotion={reduceMotion}
          />
        )
      case 5:
        return <StepReminders reminders={reminders} onChange={handleReminderChange} />
      default:
        return (
          <StepReady
            identityNames={identityNames}
            firstHabitSummary={firstHabitSummary}
            companionLabel={COMPANION_STYLES[companionStyle].label}
            reduceMotion={reduceMotion}
          />
        )
    }
  }

  const stepFooter = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Button variant="primary" size="lg" className="w-full" onClick={() => goToStep(1)}>
              Begin becoming
            </Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={() => goToStep(4)}>
              I already have a routine
            </Button>
          </>
        )
      case 1:
        return (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={selectedIdentitySlugs.length === 0}
            onClick={() => goToStep(3)}
          >
            Continue
          </Button>
        )
      case 2:
        if (customPhase === 'result') {
          return (
            <>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  setCustomIdentityText(customText)
                  goToStep(3)
                }}
              >
                Use this
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => {
                  setCustomPhase('idle')
                  setCustomPreview(null)
                }}
              >
                Try again
              </Button>
            </>
          )
        }
        return (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={customText.trim().length <= MIN_CUSTOM_LENGTH || customPhase === 'reading'}
            onClick={readCustomIdentity}
          >
            {customPhase === 'reading' ? 'Reading what you wrote…' : 'See what this could look like'}
          </Button>
        )
      case 3:
        return (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={selectedHabitIds.length === 0}
            onClick={() => goToStep(4)}
          >
            Continue
          </Button>
        )
      case 4:
        return (
          <Button variant="primary" size="lg" className="w-full" onClick={() => goToStep(5)}>
            Continue
          </Button>
        )
      case 5:
        return (
          <Button variant="primary" size="lg" className="w-full" onClick={() => goToStep(6)}>
            Continue
          </Button>
        )
      default:
        return (
          <Button variant="primary" size="lg" className="w-full" onClick={finish}>
            Go to Today
          </Button>
        )
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-12">
      <header className="flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => goToStep(previousStep)}
            aria-label="Go back to the previous step"
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : (
          <span aria-hidden="true" className="h-8 w-8 shrink-0" />
        )}

        <div
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${TOTAL_STEPS}`}
          className="h-1 flex-1 overflow-hidden rounded-full bg-secondary"
        >
          <motion.div
            className="h-1 rounded-full bg-violet-600"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </header>

      <main className="flex-1 pt-10">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            ref={focusOnMount}
            tabIndex={-1}
            custom={direction}
            variants={reduceMotion ? undefined : stepVariants}
            initial={reduceMotion ? { opacity: 1 } : 'enter'}
            animate={reduceMotion ? { opacity: 1 } : 'center'}
            exit={reduceMotion ? { opacity: 1 } : 'exit'}
            transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="outline-none"
          >
            {stepContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 z-10 -mx-6 mt-10 flex flex-col gap-2 bg-background/90 px-6 pb-1 pt-4 backdrop-blur-sm">
        {stepFooter()}
      </footer>
    </div>
  )
}
