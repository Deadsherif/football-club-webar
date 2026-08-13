import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { useJourneyOptional } from '@/journey/JourneyContext'

const RedCastleExperience = lazy(() =>
  import('@/components/red-castle/RedCastleExperience').then((m) => ({
    default: m.RedCastleExperience,
  })),
)

export function RedCastlePage() {
  const { prepareRedCastle, backFromRedCastle } = useExperienceContext()
  const journey = useJourneyOptional()

  useEffect(() => {
    prepareRedCastle()
  }, [prepareRedCastle])

  const onBack = () => {
    if (journey?.active) {
      journey.prev()
      return
    }
    backFromRedCastle()
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING EL QALAA…
        </div>
      }
    >
      <RedCastleExperience onBack={onBack} />
    </Suspense>
  )
}
