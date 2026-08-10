import * as THREE from 'three'
import type { President } from '@/data/presidents'
import type { CardAnimState } from '@/ar/presidents/PresidentCard'
import { getStadiumViewportFit } from '@/utils/stadiumViewport'

/**
 * Cinematic spatial formation around the pitch — not a flat timeline.
 * On portrait phones the ring is scaled in so side cards stay on screen.
 */
export function buildCardFormation(
  list: President[],
): Array<{ president: President; anim: CardAnimState }> {
  const slots = FORMATION_SLOTS
  const { formationScale } = getStadiumViewportFit()

  return list.map((president, i) => {
    const slot = slots[i % slots.length]
    const ring = Math.floor(i / slots.length)
    const spread = (1 + ring * 0.35) * formationScale

    const basePosition = new THREE.Vector3(
      slot.x * spread,
      slot.y * (0.85 + formationScale * 0.15) + (i % 3) * 0.04,
      slot.z * spread,
    )
    const baseRotation = new THREE.Euler(
      slot.rx + (Math.random() - 0.5) * 0.05,
      slot.ry + (Math.random() - 0.5) * 0.08,
      slot.rz,
    )

    return {
      president,
      anim: {
        basePosition,
        baseRotation,
        phase: i * 0.73,
        speed: 0.55 + (i % 5) * 0.08,
        amplitude: 0.035 + (i % 3) * 0.01,
      },
    }
  })
}

/** Relative positions around a pitch centered at origin. */
const FORMATION_SLOTS: Array<{
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
}> = [
  { x: 0, y: 1.35, z: -2.4, rx: -0.08, ry: 0, rz: 0 },
  { x: -1.5, y: 1.15, z: -1.9, rx: -0.05, ry: 0.35, rz: 0 },
  { x: 1.5, y: 1.2, z: -1.9, rx: -0.05, ry: -0.35, rz: 0 },
  { x: -2.3, y: 1.0, z: -0.6, rx: 0, ry: 0.85, rz: 0 },
  { x: 2.3, y: 1.05, z: -0.6, rx: 0, ry: -0.85, rz: 0 },
  { x: -2.1, y: 1.25, z: 0.9, rx: 0.04, ry: 2.1, rz: 0 },
  { x: 2.1, y: 1.2, z: 0.9, rx: 0.04, ry: -2.1, rz: 0 },
  { x: -1.3, y: 0.95, z: 2.0, rx: 0.08, ry: 2.6, rz: 0 },
  { x: 1.3, y: 1.0, z: 2.0, rx: 0.08, ry: -2.6, rz: 0 },
  { x: 0, y: 1.45, z: 2.5, rx: 0.1, ry: Math.PI, rz: 0 },
  { x: -0.85, y: 1.55, z: -1.1, rx: -0.1, ry: 0.2, rz: 0 },
  { x: 0.85, y: 1.5, z: -1.1, rx: -0.1, ry: -0.2, rz: 0 },
  { x: -1.8, y: 1.65, z: 0.15, rx: 0, ry: 1.2, rz: 0 },
  { x: 1.8, y: 1.6, z: 0.15, rx: 0, ry: -1.2, rz: 0 },
  { x: 0, y: 1.85, z: -0.2, rx: -0.15, ry: 0, rz: 0 },
]
