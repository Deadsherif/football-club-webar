import type { TrophyDefinition } from '@/data/trophies'
import type { TrophyAnimState } from '@/ar/trophies/TrophyObject'
import { buildCabinetPoses } from '@/ar/stadium/cabinetFormation'

/**
 * Spatial formation around the pitch — shared with presidents / board / red castle.
 */
export function buildTrophyFormation(
  list: TrophyDefinition[],
): Array<{ trophy: TrophyDefinition; anim: TrophyAnimState }> {
  const poses = buildCabinetPoses(
    list.map((t) => t.id),
    {
      prioritySlots: { 'fifa-club-world-cup': 9 },
      cardLift: 0,
      jitter: 0.05,
    },
  )

  return list.map((trophy, i) => {
    const pose = poses[i]
    return {
      trophy,
      anim: {
        basePosition: pose.position,
        baseRotation: pose.rotation,
        phase: pose.phase,
        speed: pose.speed,
        amplitude: pose.amplitude,
      },
    }
  })
}
