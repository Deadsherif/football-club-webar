import { useEffect, useRef, useState } from 'react'
import {
  RedCastleController,
  type RedCastlePhase,
} from '@/ar/red-castle/RedCastleController'
import { RedCastleHUD } from '@/components/red-castle/RedCastleHUD'
import { getRedCastleMemberById } from '@/data/redCastleMembers'
import { analytics } from '@/services/analyticsService'

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

    void controller.start()
    analytics.sectionOpened('red-castle')

    return () => {
      controller.stop()
      controllerRef.current = null
    }
  }, [])

  const selected = selectedId ? getRedCastleMemberById(selectedId) : undefined

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />

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
    </div>
  )
}
