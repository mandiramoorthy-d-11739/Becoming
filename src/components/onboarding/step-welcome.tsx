'use client'

export function StepWelcome() {
  return (
    <div className="relative pt-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500 to-rose-400 opacity-30 blur-3xl"
      />
      <div className="relative space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Who do you want to become?
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Start with who you want to be. We&apos;ll turn it into small steps you can actually live
          with.
        </p>
      </div>
    </div>
  )
}
