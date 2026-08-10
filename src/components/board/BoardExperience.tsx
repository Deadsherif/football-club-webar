import { useEffect, useRef, useState } from 'react'
import {
  BoardController,
  type BoardPhase,
} from '@/ar/board/BoardController'
import { BoardHUD } from '@/components/board/BoardHUD'
import { getBoardMemberById } from '@/data/boardMembers'
import { analytics } from '@/services/analyticsService'

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

    void controller.start()
    analytics.sectionOpened('board')

    return () => {
      controller.stop()
      controllerRef.current = null
    }
  }, [])

  const selected = selectedId ? getBoardMemberById(selectedId) : undefined

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />

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
    </div>
  )
}
