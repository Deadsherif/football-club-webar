import * as THREE from 'three'
import type { CardAnimState } from '@/ar/presidents/PresidentCard'
import type { SquadLayout } from '@/data/squads'

export interface FormationSlot {
  role: string
  position: THREE.Vector3
  rotation: THREE.Euler
}

const FORMATIONS: Record<Exclude<SquadLayout, 'featured'>, string[]> = {
  '2-3-5': ['GK', 'LB', 'RB', 'LCM', 'CM', 'RCM', 'LW', 'LIF', 'CF', 'RIF', 'RW'],
  '4-3-3': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LCM', 'CM', 'RCM', 'LW', 'ST', 'RW'],
  '4-4-2': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LM', 'LCM', 'RCM', 'RM', 'LS', 'RS'],
  '4-3-1-2': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LCM', 'CM', 'RCM', 'CAM', 'LS', 'RS'],
  '4-2-3-1': ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'LAM', 'CAM', 'RAM', 'ST'],
  '3-5-2': ['GK', 'LCB', 'CB', 'RCB', 'LWB', 'LCM', 'CM', 'RCM', 'RWB', 'LS', 'RS'],
}

/**
 * Converts a data-owned formation to pitch coordinates. `featured` is a
 * clearly non-historic presentation layout for eras without a verified XI.
 */
export function formationToPositions(
  formation: SquadLayout,
  count: number,
  scale = 1,
): CardAnimState[] {
  const slots =
    formation === 'featured'
      ? featuredSlots(count)
      : positionFormation(FORMATIONS[formation])

  return slots.slice(0, count).map((slot, index) => ({
    basePosition: slot.position.multiplyScalar(scale),
    baseRotation: slot.rotation,
    phase: index * 0.73,
    speed: 0.55 + (index % 5) * 0.08,
    amplitude: 0.026 + (index % 3) * 0.008,
  }))
}

export function getFormationRoles(formation: SquadLayout, count: number): string[] {
  if (formation === 'featured') {
    return Array.from({ length: count }, () => 'FEATURED LEGEND')
  }
  return FORMATIONS[formation].slice(0, count)
}

function positionFormation(roles: string[]): FormationSlot[] {
  const rows = new Map<string, [number, number]>([
    ['GK', [0, -1.5]],
    ['LB', [-1.35, -0.8]],
    ['LCB', [-0.45, -0.9]],
    ['CB', [0, -0.9]],
    ['RCB', [0.45, -0.9]],
    ['RB', [1.35, -0.8]],
    ['LWB', [-1.45, -0.25]],
    ['RWB', [1.45, -0.25]],
    ['LDM', [-0.45, -0.35]],
    ['RDM', [0.45, -0.35]],
    ['LM', [-1.2, -0.12]],
    ['LCM', [-0.55, -0.1]],
    ['CM', [0, -0.05]],
    ['RCM', [0.55, -0.1]],
    ['RM', [1.2, -0.12]],
    ['LAM', [-0.8, 0.35]],
    ['CAM', [0, 0.46]],
    ['RAM', [0.8, 0.35]],
    ['LW', [-1.15, 0.8]],
    ['LIF', [-0.55, 0.85]],
    ['CF', [0, 1.05]],
    ['RIF', [0.55, 0.85]],
    ['ST', [0, 1.05]],
    ['RW', [1.15, 0.8]],
    ['LS', [-0.42, 0.95]],
    ['RS', [0.42, 0.95]],
  ])

  return roles.map((role) => {
    const [x, z] = rows.get(role) ?? [0, 0]
    return makeSlot(role, x, z)
  })
}

function featuredSlots(count: number): FormationSlot[] {
  if (count === 1) return [makeSlot('FEATURED LEGEND', 0, 0.1)]

  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2
    return makeSlot(
      'FEATURED LEGEND',
      Math.cos(angle) * 1.35,
      Math.sin(angle) * 0.85,
    )
  })
}

function makeSlot(role: string, x: number, z: number): FormationSlot {
  return {
    role,
    position: new THREE.Vector3(x, 0, z),
    rotation: new THREE.Euler(-0.08, x * -0.16, 0),
  }
}
