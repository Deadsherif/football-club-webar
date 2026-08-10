import * as THREE from 'three'
import type { StadiumViewportFit } from '@/utils/stadiumViewport'

/**
 * Shared select framing used by Presidents / Board / Red Castle / Legends / Trophies.
 * Keeps the subject in the upper half so the bottom description sheet stays readable.
 */
export function computeStableCardFraming(
  homeWorld: THREE.Vector3,
  fit: StadiumViewportFit,
  lookYOffset = 0.08,
): { cam: THREE.Vector3; look: THREE.Vector3 } {
  const outward = new THREE.Vector3(homeWorld.x, 0, homeWorld.z).normalize()
  if (outward.lengthSq() < 0.01) outward.set(0, 0, 1)

  // Farther pull = smaller on-screen subject; portrait needs more room for the HUD sheet.
  const pull = fit.isPortrait ? 3.55 : 2.85
  // Look slightly below the subject so it sits in the upper ~55% of the frame.
  const lookBias = fit.isPortrait ? -0.28 : -0.16
  const look = homeWorld
    .clone()
    .add(new THREE.Vector3(0, lookYOffset + lookBias, 0))
  const cam = homeWorld
    .clone()
    .add(outward.multiplyScalar(pull))
    .setY(homeWorld.y + (fit.isPortrait ? 0.42 : 0.22))
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
