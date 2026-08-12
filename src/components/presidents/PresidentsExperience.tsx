import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PresidentsController,
  type PresidentsPhase,
} from '@/ar/presidents/PresidentsController'
import { PresidentsHUD } from '@/components/presidents/PresidentsHUD'
import { getPresidentById } from '@/data/presidents'
import { analytics } from '@/services/analyticsService'
import { useJourneyChapterSync } from '@/journey/useJourneyChapterSync'
import { useJourneyOptional } from '@/journey/JourneyContext'
import { CabinetCloseButton } from '@/components/ui/CabinetCloseButton'

interface PresidentsExperienceProps {
  onBack: () => void
}

export function PresidentsExperience({ onBack }: PresidentsExperienceProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<PresidentsController | null>(null)
  const [phase, setPhase] = useState<PresidentsPhase>('boot')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [yearLabel, setYearLabel] = useState('1907')
  const [showLegacyBanner, setShowLegacyBanner] = useState(false)
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

  const journeyHere = useJourneyChapterSync('presidents', onJourneyItem, ready)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const controller = new PresidentsController(el)
    controllerRef.current = controller
    controller.setHooks({
      onPhase: setPhase,
      onSelect: (id) => {
        setSelectedId(id)
        if (id) {
          setShowLegacyBanner(true)
          window.setTimeout(() => setShowLegacyBanner(false), 1100)
        }
      },
      onYearLabel: setYearLabel,
    })

    void controller.start().then(() => {
      if (journey?.active) {
        controller.setStoryLocked(true)
      }
      setReady(true)
    })
    analytics.sectionOpened('presidents')

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

  const selected = selectedId ? getPresidentById(selectedId) : undefined
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
        <PresidentsHUD
          phase={phase}
          yearLabel={yearLabel}
          selected={selected}
          showLegacyBanner={showLegacyBanner}
          onBack={onBack}
          onPrev={() => controllerRef.current?.prev()}
          onNext={() => controllerRef.current?.next()}
          onCloseDetail={() => controllerRef.current?.clearSelection()}
        />
      )}
    </div>
  )
}
