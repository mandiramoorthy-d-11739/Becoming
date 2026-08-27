'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

type AnswerKey = 'whatFeltGood' | 'whatFeltDifficult' | 'whatBecameEasier' | 'whatToCarryForward'

interface Question {
  key: AnswerKey
  title: string
  summaryLabel: string
  placeholder: string
  chips: readonly string[]
}

const QUESTIONS: readonly Question[] = [
  {
    key: 'whatFeltGood',
    title: 'What felt good this week?',
    summaryLabel: 'What felt good',
    placeholder: 'Anything at all. It can be small.',
    chips: ['Showing up', 'Morning walks', 'Feeling calmer', 'Reaching out'],
  },
  {
    key: 'whatFeltDifficult',
    title: 'What felt difficult?',
    summaryLabel: 'What felt difficult',
    placeholder: 'No need to soften it.',
    chips: ['Late nights', 'Losing motivation', 'Too much at once', 'Weekends'],
  },
  {
    key: 'whatBecameEasier',
    title: 'Did anything become easier?',
    summaryLabel: 'What became easier',
    placeholder: 'Even slightly easier counts.',
    chips: ['Meditation', 'Getting outside', 'Saying no', 'Nothing yet'],
  },
  {
    key: 'whatToCarryForward',
    title: 'What should next week feel like?',
    summaryLabel: 'Next week',
    placeholder: 'A word or a sentence is enough.',
    chips: ['Gentler', 'Steadier', 'A little more', 'The same'],
  },
] as const

const SUMMARY_STEP = QUESTIONS.length

const EMPTY_ANSWERS: Record<AnswerKey, string> = {
  whatFeltGood: '',
  whatFeltDifficult: '',
  whatBecameEasier: '',
  whatToCarryForward: '',
}

export default function WeeklyReflectionPage() {
  const router = useRouter()
  const { reducedMotion } = useAppStore()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>(EMPTY_ANSWERS)

  const isSummary = step === SUMMARY_STEP
  const question = isSummary ? undefined : QUESTIONS[step]

  const setAnswer = (key: AnswerKey, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const advance = () => setStep((prev) => Math.min(prev + 1, SUMMARY_STEP))

  const ctaLabel = isSummary
    ? 'Carry this into next week'
    : step === SUMMARY_STEP - 1
      ? 'See my week'
      : 'Continue'

  const handleCta = () => {
    if (isSummary) {
      router.push('/you')
      return
    }
    advance()
  }

  const content = question ? (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight text-balance">{question.title}</h2>

      <div className="flex flex-wrap gap-2">
        {question.chips.map((chip) => {
          const selected = answers[question.key] === chip
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={selected}
              onClick={() => setAnswer(question.key, chip)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                selected
                  ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                  : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {chip}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <label htmlFor={question.key} className="sr-only">
          {question.title}
        </label>
        <Textarea
          id={question.key}
          value={answers[question.key]}
          onChange={(event) => setAnswer(question.key, event.target.value)}
          placeholder={question.placeholder}
          className="min-h-[140px]"
        />
      </div>
    </div>
  ) : (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Your week was about returning.
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You missed a few mornings, but you came back without abandoning your habits. That matters
          more than a perfect streak.
        </p>
      </div>

      <dl className="space-y-4 rounded-3xl bg-secondary/60 p-6">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="space-y-1">
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {q.summaryLabel}
            </dt>
            <dd
              className={cn(
                'text-sm leading-relaxed',
                !answers[q.key] && 'italic text-muted-foreground'
              )}
            >
              {answers[q.key] || 'Left blank — that’s allowed too.'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-12">
      {/* Progress + skip -------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={SUMMARY_STEP + 1}
          aria-valuenow={step + 1}
          aria-label="Reflection progress"
        >
          {Array.from({ length: SUMMARY_STEP + 1 }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-5 bg-violet-500' : i < step ? 'w-1.5 bg-violet-300 dark:bg-violet-800' : 'w-1.5 bg-secondary'
              )}
            />
          ))}
        </div>

        {!isSummary && (
          <Button
            variant="ghost"
            size="sm"
            onClick={advance}
            className="-mr-2 text-muted-foreground"
          >
            Skip
          </Button>
        )}
      </div>

      {/* Step ------------------------------------------------------------- */}
      <div className="flex flex-1 flex-col justify-center py-12">
        {reducedMotion ? (
          <div key={step}>{content}</div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* CTA -------------------------------------------------------------- */}
      <Button variant="primary" size="lg" className="w-full" onClick={handleCta}>
        {ctaLabel}
      </Button>
    </div>
  )
}
