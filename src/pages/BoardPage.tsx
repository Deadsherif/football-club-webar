import { lazy, Suspense, useEffect } from 'react'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { useJourneyOptional } from '@/journey/JourneyContext'

const BoardExperience = lazy(() =>
  import('@/components/board/BoardExperience').then((m) => ({
    default: m.BoardExperience,
  })),
)

export function BoardPage() {
  const { prepareBoard, backFromBoard } = useExperienceContext()
  const journey = useJourneyOptional()

  useEffect(() => {
    prepareBoard()
  }, [prepareBoard])

  const onBack = () => {
    if (journey?.active) {
      journey.prev()
      return
    }
    backFromBoard()
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
          LOADING BOARD…
        </div>
      }
    >
      <BoardExperience onBack={onBack} />
    </Suspense>
  )
}
