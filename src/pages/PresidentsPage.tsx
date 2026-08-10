import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'

const PresidentsExperience = lazy(() =>
  import('@/components/presidents/PresidentsExperience').then((m) => ({
    default: m.PresidentsExperience,
  })),
)

export function PresidentsPage() {
  const { preparePresidents, backFromPresidents } = useExperienceContext()

  useEffect(() => {
    preparePresidents()
  }, [preparePresidents])

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING STADIUM…
        </div>
      }
    >
      <PresidentsExperience onBack={backFromPresidents} />
    </Suspense>
  )
}
