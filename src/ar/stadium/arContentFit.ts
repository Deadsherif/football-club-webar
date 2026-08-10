import * as THREE from 'three'

/**
 * Layout metrics so floating cards sit on the crest stadium pitch
 * instead of spanning a free-WebGL-sized arena.
 */
export interface ArStadiumContentFit {
  /** Multiplier for formation XZ coordinates (formations authored ~±1.4). */
  layoutScale: number
  /** Visual scale of each card mesh. */
  cardScale: number
  /** contentRoot.y — just above pitch / lower bowl. */
  contentHeight: number
  /** Soft float amplitude so cards don't leave the pitch. */
  floatAmplitude: number
}

const FORMATION_RADIUS = 1.4

/**
 * Derive card layout from the loaded stadium bounds (after prepareStadiumModel).
 */
export function computeArStadiumContentFit(
  stadium: THREE.Object3D,
  targetWidth: number,
): ArStadiumContentFit {
  const bounds = new THREE.Box3().setFromObject(stadium)
  const size = new THREE.Vector3()
  bounds.getSize(size)

  // Spread across the pitch for flying cards.
  const footprint = Math.min(size.x, size.z) * 0.62
  const layoutScale = footprint / FORMATION_RADIUS

  // Compact idle cards on the crest; select zoom pulls them toward the lens.
  const cardScale = THREE.MathUtils.clamp(footprint * 0.72, 0.26, 0.38)

  // Fly clearly above the pitch / lower bowl.
  const contentHeight = Math.max(size.y * 0.22, targetWidth * 0.14)

  return {
    layoutScale,
    cardScale,
    contentHeight,
    floatAmplitude: THREE.MathUtils.clamp(cardScale * 0.16, 0.04, 0.07),
  }
}

/** Compact oval / FIFA layout for AR crest (units before layoutScale). */
export function arPitchSlots(count: number): Array<{ x: number; z: number; ry: number }> {
  if (count <= 1) return [{ x: 0, z: 0, ry: 0 }]

  return Array.from({ length: count }, (_, index) => {
    const t = index / count
    const angle = t * Math.PI * 2 - Math.PI / 2
    // Slightly wider oval so larger cards don't overlap as much.
    const x = Math.cos(angle) * 1.25
    const z = Math.sin(angle) * 0.82
    return { x, z, ry: -x * 0.18 }
  })
}
