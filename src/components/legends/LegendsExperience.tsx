import { useEffect, useRef, useState } from 'react'
import { LegendsController } from '@/ar/legends/LegendsController'
import { LegendsHUD } from '@/components/legends/LegendsHUD'
import type { LegendPlayer } from '@/data/players'
import { historicalSquads, type HistoricalSquad } from '@/data/squads'
import { analytics } from '@/services/analyticsService'

interface LegendsExperienceProps {
  onBack: () => void
}

export function LegendsExperience({ onBack }: LegendsExperienceProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<LegendsController | null>(null)
  const [selected, setSelected] = useState<LegendPlayer | null>(null)
  const [squad, setSquad] = useState<HistoricalSquad>(historicalSquads[0])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const controller = new LegendsController(mount)
    controllerRef.current = controller
    controller.setHooks({
      onSelect: (player) => {
        setSelected(player)
        if (player) analytics.legendPlayerSelected(player.id)
      },
      onSquadChange: (nextSquad) => {
        setSquad(nextSquad)
        if (nextSquad.id === 'all-time-legends') analytics.allTimeLegendsOpened()
        else analytics.legendEraSelected(nextSquad.id)
      },
    })
    void controller.start()
    analytics.legendsOpened()

    return () => {
      controller.stop()
      controllerRef.current = null
    }
  }, [])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      <LegendsHUD
        squad={squad}
        selected={selected}
        onBack={onBack}
        onSelectSquad={(id) => controllerRef.current?.selectSquad(id)}
        onPreviousSquad={() => controllerRef.current?.previousSquad()}
        onNextSquad={() => controllerRef.current?.nextSquad()}
        onPreviousPlayer={() => controllerRef.current?.previousPlayer()}
        onNextPlayer={() => controllerRef.current?.nextPlayer()}
        onClosePlayer={() => controllerRef.current?.selectPlayer(null)}
      />
    </div>
  )
}
