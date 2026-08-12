import { t } from '@/i18n'
import { useJourney } from '@/journey/JourneyContext'

/** Fallback route shell — JourneyChrome already paints the complete state. */
export function CompleteJourneyPage() {
  const journey = useJourney()
  const copy = t()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-pitch-ink px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(227,6,19,0.22),_transparent_60%)]" />
      {!journey.active && (
        <div className="relative z-10">
          <p className="font-title text-sm tracking-[0.3em] text-pitch-gold">
            {copy.brand}
          </p>
          <h1 className="mt-4 font-title text-3xl tracking-[0.12em] text-white">
            {copy.journeyCompleteTitle}
          </h1>
          <button
            type="button"
            onClick={journey.start}
            className="mt-8 rounded-full bg-ahly-red px-8 py-3 text-xs font-bold tracking-[0.2em] text-white"
          >
            {copy.journeyReplay}
          </button>
        </div>
      )}
    </div>
  )
}
