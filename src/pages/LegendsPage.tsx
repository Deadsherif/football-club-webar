import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'

const LegendsExperience = lazy(() =>
  import('@/components/legends/LegendsExperience').then((m) => ({
    default: m.LegendsExperience,
  })),
)

export function LegendsPage() {
  const { prepareStandaloneLegends, closeLegends } = useExperienceContext()

  useEffect(() => {
    prepareStandaloneLegends()
  }, [prepareStandaloneLegends])

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING LEGENDS…
        </div>
      }
    >
      <LegendsExperience onBack={closeLegends} />
    </Suspense>
  )
}
