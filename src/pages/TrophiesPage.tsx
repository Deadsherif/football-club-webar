import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { useJourneyOptional } from '@/journey/JourneyContext'

const TrophiesExperience = lazy(() =>
  import('@/components/trophies/TrophiesExperience').then((m) => ({
    default: m.TrophiesExperience,
  })),
)

export function TrophiesPage() {
  const { prepareTrophies, backFromTrophies } = useExperienceContext()
  const journey = useJourneyOptional()

  useEffect(() => {
    prepareTrophies()
  }, [prepareTrophies])

  const onBack = () => {
    if (journey?.active) {
      journey.prev()
      return
    }
    backFromTrophies()
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING TROPHIES…
        </div>
      }
    >
      <TrophiesExperience onBack={onBack} />
    </Suspense>
  )
}
