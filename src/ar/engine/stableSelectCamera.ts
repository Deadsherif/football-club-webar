import * as THREE from 'three'
import type { StadiumViewportFit } from '@/utils/stadiumViewport'

/**
 * Shared select framing used by Presidents / Board / Red Castle / Legends / Trophies.
 * Keeps the subject in the free band between journey top tabs and bottom transport.
 */
export function computeStableCardFraming(
  homeWorld: THREE.Vector3,
  fit: StadiumViewportFit,
  lookYOffset = 0.04,
): { cam: THREE.Vector3; look: THREE.Vector3 } {
  const outward = new THREE.Vector3(homeWorld.x, 0, homeWorld.z).normalize()
  if (outward.lengthSq() < 0.01) outward.set(0, 0, 1)

  // Mid pull — readable, but leaves room above tabs / below pause bar.
  const pull = fit.isPortrait ? 2.85 : 2.35
  // Look a touch above the card so it sits lower in frame (clears chapter chips).
  const lookBias = fit.isPortrait ? 0.12 : 0.06
  const look = homeWorld
    .clone()
    .add(new THREE.Vector3(0, lookYOffset + lookBias, 0))
  const cam = homeWorld
    .clone()
    .add(outward.multiplyScalar(pull))
    .setY(homeWorld.y + (fit.isPortrait ? 0.38 : 0.22))
  return { cam, look }
}

/**
 * Journey: frame left model + right card/trophy in the free band
 * between top chapter tabs and bottom transport.
 * Camera pulls back enough for both columns on phone and desktop.
 */
export function computeJourneySplitFraming(
  stageY: number,
  fit: StadiumViewportFit,
): { cam: THREE.Vector3; look: THREE.Vector3 } {
  const lookBias = fit.isPortrait ? 0.02 : 0.01
  const lookX = fit.isPortrait ? 0.02 : 0.04
  const look = new THREE.Vector3(lookX, stageY + lookBias, 0.08)
  const dist = fit.isPortrait ? 3.85 : 3.35
  const cam = new THREE.Vector3(
    lookX,
    stageY + (fit.isPortrait ? 0.18 : 0.12),
    dist,
  )
  return { cam, look }
}

/** Hold camera rock-solid on a selected card (no continuous lerp jitter). */
export function holdSelectCamera(
  camera: THREE.PerspectiveCamera,
  desiredCam: THREE.Vector3,
  lookTarget: THREE.Vector3,
  desiredLook: THREE.Vector3,
  controlsTarget: THREE.Vector3,
): void {
  camera.position.copy(desiredCam)
  lookTarget.copy(desiredLook)
  controlsTarget.copy(desiredLook)
  camera.lookAt(lookTarget)
}
