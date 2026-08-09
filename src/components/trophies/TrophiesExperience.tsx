import { useEffect, useRef, useState } from 'react'
import {
  TrophiesController,
  type TrophiesPhase,
} from '@/ar/trophies/TrophiesController'
import { TrophiesHUD } from '@/components/trophies/TrophiesHUD'
import { getTrophyById } from '@/data/trophies'
import { analytics } from '@/services/analyticsService'

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

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

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

    void controller.start()
    analytics.trophiesOpened()
    analytics.sectionOpened('trophies')

    return () => {
      controller.stop()
      controllerRef.current = null
    }
  }, [])

  const selected = selectedId ? getTrophyById(selectedId) : undefined

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />

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
    </div>
  )
}
