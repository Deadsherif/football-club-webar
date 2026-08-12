import * as THREE from 'three'
import { getStadiumViewportFit } from '@/utils/stadiumViewport'

/**
 * Shared free-cabinet ring used by trophies, presidents, board, and red castle.
 * Positions / yaw match the trophies view so every tab feels the same.
 */
export const CABINET_FORMATION_SLOTS: ReadonlyArray<{
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

export interface CabinetSlotPose {
  position: THREE.Vector3
  rotation: THREE.Euler
  phase: number
  speed: number
  amplitude: number
}

export interface CabinetFormationOptions {
  /** Prefer specific ring indices for known ids (e.g. FIFA CWC up front). */
  prioritySlots?: Record<string, number>
  /** Extra upright lift for flat cards so portraits clear the pitch. */
  cardLift?: number
  jitter?: number
}

/**
 * Build world poses for a cabinet list — same ring / yaw as trophies.
 */
export function buildCabinetPoses(
  ids: string[],
  options: CabinetFormationOptions = {},
): CabinetSlotPose[] {
  const slots = CABINET_FORMATION_SLOTS
  const { formationScale } = getStadiumViewportFit()
  const used = new Set<number>()
  const slotById = new Map<string, number>()
  const priority = options.prioritySlots ?? {}
  const cardLift = options.cardLift ?? 0
  const jitter = options.jitter ?? 0.05

  for (const [id, slotIndex] of Object.entries(priority)) {
    if (ids.includes(id) && slotIndex < slots.length) {
      slotById.set(id, slotIndex)
      used.add(slotIndex)
    }
  }

  let next = 0
  const takeSlot = () => {
    while (used.has(next) && next < slots.length * 4) next++
    const index = next
    used.add(index)
    next++
    return index
  }

  return ids.map((id, i) => {
    const slotIndex = slotById.get(id) ?? takeSlot()
    const slot = slots[slotIndex % slots.length]
    const ring = Math.floor(slotIndex / slots.length)
    const spread = (1 + ring * 0.35) * formationScale

    return {
      position: new THREE.Vector3(
        slot.x * spread,
        slot.y * formationScale + cardLift + (i % 3) * 0.04,
        slot.z * spread,
      ),
      rotation: new THREE.Euler(
        slot.rx + (Math.random() - 0.5) * jitter * 0.8,
        slot.ry + (Math.random() - 0.5) * jitter,
        slot.rz,
      ),
      phase: i * 0.73,
      speed: 0.5 + (i % 5) * 0.07,
      amplitude: 0.03 + (i % 3) * 0.01,
    }
  })
}
