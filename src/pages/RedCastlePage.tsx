import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'

const RedCastleExperience = lazy(() =>
  import('@/components/red-castle/RedCastleExperience').then((m) => ({
    default: m.RedCastleExperience,
  })),
)

export function RedCastlePage() {
  const { prepareRedCastle, backFromRedCastle } = useExperienceContext()

  useEffect(() => {
    prepareRedCastle()
  }, [prepareRedCastle])

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING EL QALAA…
        </div>
      }
    >
      <RedCastleExperience onBack={backFromRedCastle} />
    </Suspense>
  )
}
