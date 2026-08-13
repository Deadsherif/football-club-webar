import { useEffect } from 'react'
import { useJourney } from '@/journey/JourneyContext'

/** `/journey` starts the standalone (no-AR) history journey. */
export function JourneyEntryPage() {
  const journey = useJourney()

  useEffect(() => {
    journey.start()
    // start() navigates to the first chapter route
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
      STARTING JOURNEY…
    </div>
  )
}
