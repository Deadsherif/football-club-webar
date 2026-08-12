import type { President } from '@/data/presidents'
import type { CardAnimState } from '@/ar/presidents/PresidentCard'
import { buildCabinetPoses } from '@/ar/stadium/cabinetFormation'

/**
 * Same cabinet ring / yaw as trophies — cards get a small lift for readability.
 */
export function buildCardFormation(
  list: President[],
): Array<{ president: President; anim: CardAnimState }> {
  const poses = buildCabinetPoses(
    list.map((p) => p.id),
    { cardLift: 0.2, jitter: 0.05 },
  )

  return list.map((president, i) => {
    const pose = poses[i]
    return {
      president,
      anim: {
        basePosition: pose.position,
        baseRotation: pose.rotation,
        phase: pose.phase,
        speed: pose.speed + 0.05,
        amplitude: pose.amplitude + 0.005,
      },
    }
  })
}
