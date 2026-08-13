import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'

const TrophiesExperience = lazy(() =>
  import('@/components/trophies/TrophiesExperience').then((m) => ({
    default: m.TrophiesExperience,
  })),
)

export function TrophiesPage() {
  const { prepareTrophies, backFromTrophies } = useExperienceContext()

  useEffect(() => {
    prepareTrophies()
  }, [prepareTrophies])

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING TROPHIES…
        </div>
      }
    >
      <TrophiesExperience onBack={backFromTrophies} />
    </Suspense>
  )
}
