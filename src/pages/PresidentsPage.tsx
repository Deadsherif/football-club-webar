import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { useJourneyOptional } from '@/journey/JourneyContext'

const PresidentsExperience = lazy(() =>
  import('@/components/presidents/PresidentsExperience').then((m) => ({
    default: m.PresidentsExperience,
  })),
)

export function PresidentsPage() {
  const { preparePresidents, backFromPresidents } = useExperienceContext()
  const journey = useJourneyOptional()

  useEffect(() => {
    preparePresidents()
  }, [preparePresidents])

  const onBack = () => {
    if (journey?.active) {
      journey.prev()
      return
    }
    backFromPresidents()
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING STADIUM…
        </div>
      }
    >
      <PresidentsExperience onBack={onBack} />
    </Suspense>
  )
}
