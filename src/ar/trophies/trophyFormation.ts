import * as THREE from 'three'
import type { TrophyDefinition } from '@/data/trophies'
import type { TrophyAnimState } from '@/ar/trophies/TrophyObject'

/**
 * Spatial formation around the pitch for trophy models.
 */
export function buildTrophyFormation(
  list: TrophyDefinition[],
): Array<{ trophy: TrophyDefinition; anim: TrophyAnimState }> {
  const slots = FORMATION_SLOTS
  return list.map((trophy, i) => {
    const slot = slots[i % slots.length]
    const ring = Math.floor(i / slots.length)
    const spread = 1 + ring * 0.35

    const basePosition = new THREE.Vector3(
      slot.x * spread,
      slot.y + (i % 3) * 0.04,
      slot.z * spread,
    )
    const baseRotation = new THREE.Euler(
      slot.rx + (Math.random() - 0.5) * 0.04,
      slot.ry + (Math.random() - 0.5) * 0.06,
      slot.rz,
    )

    return {
      trophy,
      anim: {
        basePosition,
        baseRotation,
        phase: i * 0.73,
        speed: 0.5 + (i % 5) * 0.07,
        amplitude: 0.03 + (i % 3) * 0.01,
      },
    }
  })
}

const FORMATION_SLOTS: Array<{
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
}> = [
  { x: 0, y: 0.15, z: -2.2, rx: 0, ry: 0, rz: 0 },
  { x: -1.4, y: 0.1, z: -1.75, rx: 0, ry: 0.35, rz: 0 },
  { x: 1.4, y: 0.12, z: -1.75, rx: 0, ry: -0.35, rz: 0 },
  { x: -2.15, y: 0.08, z: -0.55, rx: 0, ry: 0.85, rz: 0 },
  { x: 2.15, y: 0.1, z: -0.55, rx: 0, ry: -0.85, rz: 0 },
  { x: -2.0, y: 0.14, z: 0.85, rx: 0, ry: 2.1, rz: 0 },
  { x: 2.0, y: 0.12, z: 0.85, rx: 0, ry: -2.1, rz: 0 },
  { x: -1.2, y: 0.08, z: 1.9, rx: 0, ry: 2.6, rz: 0 },
  { x: 1.2, y: 0.1, z: 1.9, rx: 0, ry: -2.6, rz: 0 },
  { x: 0, y: 0.16, z: 2.35, rx: 0, ry: Math.PI, rz: 0 },
  { x: -0.8, y: 0.2, z: -1.0, rx: 0, ry: 0.2, rz: 0 },
  { x: 0.8, y: 0.18, z: -1.0, rx: 0, ry: -0.2, rz: 0 },
  { x: 0, y: 0.22, z: -0.15, rx: 0, ry: 0, rz: 0 },
]
