import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TrophiesController,
  type TrophiesPhase,
} from '@/ar/trophies/TrophiesController'
import { TrophiesHUD } from '@/components/trophies/TrophiesHUD'
import { getTrophyById } from '@/data/trophies'
import { analytics } from '@/services/analyticsService'
import { useJourneyChapterSync } from '@/journey/useJourneyChapterSync'
import { useJourneyOptional } from '@/journey/JourneyContext'
import { CabinetCloseButton } from '@/components/ui/CabinetCloseButton'
import { detectDeviceCapability } from '@/utils/deviceCapability'

interface TrophiesExperienceProps {
  onBack: () => void
}

export function TrophiesExperience({ onBack }: TrophiesExperienceProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<TrophiesController | null>(null)
  const [phase, setPhase] = useState<TrophiesPhase>('boot')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chipLabel, setChipLabel] = useState('١٥٦')
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

  const journeyHere = useJourneyChapterSync('trophies', onJourneyItem, ready)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    let cancelled = false
    const controller = new TrophiesController(el)
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
      onLabel: setChipLabel,
    })

    const boot = async () => {
      // Let the previous WebGL chapter release GPU memory on iOS.
      if (detectDeviceCapability().isMobile) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
        await new Promise((resolve) => window.setTimeout(resolve, 80))
      }
      if (cancelled) return
      await controller.start()
      if (cancelled) return
      if (journey?.active) controller.setStoryLocked(true)
      setReady(true)
    }

    void boot()
    analytics.trophiesOpened()
    analytics.sectionOpened('trophies')

    return () => {
      cancelled = true
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

  const selected = selectedId ? getTrophyById(selectedId) : undefined
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
        <TrophiesHUD
          phase={phase}
          chipLabel={chipLabel}
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
