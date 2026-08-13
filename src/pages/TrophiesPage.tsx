import { lazy, Suspense, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { useJourneyOptional } from '@/journey/JourneyContext'
import { JOURNEY_CHAPTER_ROUTES, isJourneyPath } from '@/data/journey'

const TrophiesExperience = lazy(() =>
  import('@/components/trophies/TrophiesExperience').then((m) => ({
    default: m.TrophiesExperience,
  })),
)

export function TrophiesPage() {
  const { prepareTrophies, backFromTrophies } = useExperienceContext()
  const journey = useJourneyOptional()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    prepareTrophies()
  }, [prepareTrophies])

  useEffect(() => {
    if (!journey?.active) return
    if (isJourneyPath(location.pathname)) return
    navigate(JOURNEY_CHAPTER_ROUTES.trophies, { replace: true })
  }, [journey?.active, location.pathname, navigate])

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
