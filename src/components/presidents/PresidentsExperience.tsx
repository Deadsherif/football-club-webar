import { useEffect, useRef, useState } from 'react'
import {
  PresidentsController,
  type PresidentsPhase,
} from '@/ar/presidents/PresidentsController'
import { PresidentsHUD } from '@/components/presidents/PresidentsHUD'
import { getPresidentById } from '@/data/presidents'
import { analytics } from '@/services/analyticsService'

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

    void controller.start()
    analytics.sectionOpened('presidents')

    return () => {
      controller.stop()
      controllerRef.current = null
    }
  }, [])

  const selected = selectedId ? getPresidentById(selectedId) : undefined

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />

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
    </div>
  )
}
