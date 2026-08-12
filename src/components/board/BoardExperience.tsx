import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BoardController,
  type BoardPhase,
} from '@/ar/board/BoardController'
import { BoardHUD } from '@/components/board/BoardHUD'
import { getBoardMemberById } from '@/data/boardMembers'
import { analytics } from '@/services/analyticsService'
import { useJourneyChapterSync } from '@/journey/useJourneyChapterSync'
import { useJourneyOptional } from '@/journey/JourneyContext'
import { CabinetCloseButton } from '@/components/ui/CabinetCloseButton'

interface BoardExperienceProps {
  onBack: () => void
}

export function BoardExperience({ onBack }: BoardExperienceProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<BoardController | null>(null)
  const [phase, setPhase] = useState<BoardPhase>('boot')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [roleLabel, setRoleLabel] = useState('Board')
  const [showBanner, setShowBanner] = useState(false)
  const [ready, setReady] = useState(false)
  const journey = useJourneyOptional()

  const firstJourneySyncRef = useRef(true)

  const onJourneyItem = useCallback((itemId: string) => {
    const controller = controllerRef.current
    if (!controller) return
    controller.setStoryLocked(true)
    // Chapter open: full cabinet. Next/Prev: open the step item.
    if (firstJourneySyncRef.current) {
      firstJourneySyncRef.current = false
      controller.enterJourneyCabinet()
      return
    }
    controller.showJourneyItem(itemId)
  }, [])

  const journeyHere = useJourneyChapterSync('board', onJourneyItem, ready)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const controller = new BoardController(el)
    controllerRef.current = controller
    controller.setHooks({
      onPhase: setPhase,
      onSelect: (id) => {
        setSelectedId(id)
        if (id) {
          setShowBanner(true)
          window.setTimeout(() => setShowBanner(false), 1100)
        }
      },
      onYearLabel: setRoleLabel,
    })

    void controller.start().then(() => {
      if (journey?.active) {
        controller.setStoryLocked(true)
      }
      setReady(true)
    })
    analytics.sectionOpened('board')

    return () => {
      setReady(false)
      controller.stop()
      controllerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, [])

  useEffect(() => {
    controllerRef.current?.setStoryLocked(Boolean(journeyHere))
  }, [journeyHere])

  useEffect(() => {
    controllerRef.current?.setFreeLook(Boolean(journey?.view.freeLook))
  }, [journey?.view.freeLook])

  const selected = selectedId ? getBoardMemberById(selectedId) : undefined
  const hideLocalDetail = Boolean(journey?.active)

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />

      <CabinetCloseButton
        visible={Boolean(selectedId)}
        journey={Boolean(journey?.active)}
        onClose={() => controllerRef.current?.clearSelection()}
      />

      {!hideLocalDetail && (
        <BoardHUD
          phase={phase}
          roleLabel={roleLabel}
          selected={selected}
          showBanner={showBanner}
          onBack={onBack}
          onPrev={() => controllerRef.current?.prev()}
          onNext={() => controllerRef.current?.next()}
          onCloseDetail={() => controllerRef.current?.clearSelection()}
        />
      )}
    </div>
  )
}
