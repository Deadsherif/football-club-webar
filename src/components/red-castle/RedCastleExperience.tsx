import { useCallback, useEffect, useRef, useState } from 'react'
import {
  RedCastleController,
  type RedCastlePhase,
} from '@/ar/red-castle/RedCastleController'
import { RedCastleHUD } from '@/components/red-castle/RedCastleHUD'
import { getRedCastleMemberById } from '@/data/redCastleMembers'
import { analytics } from '@/services/analyticsService'
import { useJourneyChapterSync } from '@/journey/useJourneyChapterSync'
import { useJourneyOptional } from '@/journey/JourneyContext'
import { CabinetCloseButton } from '@/components/ui/CabinetCloseButton'

interface RedCastleExperienceProps {
  onBack: () => void
}

export function RedCastleExperience({ onBack }: RedCastleExperienceProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<RedCastleController | null>(null)
  const [phase, setPhase] = useState<RedCastlePhase>('boot')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [roleLabel, setRoleLabel] = useState('El Qalaa El Hamraa')
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

  const journeyHere = useJourneyChapterSync('red-castle', onJourneyItem, ready)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const controller = new RedCastleController(el)
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
    analytics.sectionOpened('red-castle')

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

  const selected = selectedId ? getRedCastleMemberById(selectedId) : undefined
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
        <RedCastleHUD
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
