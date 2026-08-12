import * as THREE from 'three'
import type { StadiumViewportFit } from '@/utils/stadiumViewport'

/** Shared free-WebGL stadium size used by trophies / presidents / board / red castle. */
export const STADIUM_FREE_VIEW_WIDTH = 5.6

/** Slight lift so stadium + floating content clear the journey chrome. */
export const STADIUM_SCENE_LIFT = 0.35

/** Extra scale for portrait cards (presidents / board / red castle). */
export const CARD_CABINET_SCALE = 1.22

/** Explore pull-back — leave margin under tabs and above the transport bar. */
export const CARD_CABINET_DISTANCE_SCALE = 1.14

export interface StadiumExplorePose {
  camera: THREE.Vector3
  look: THREE.Vector3
}

/**
 * Explore camera framed in the free band between journey top tabs
 * and bottom transport (zoomed out enough for crest + full card ring).
 */
export function getStadiumExplorePose(
  contentAltitude: number,
  fit: StadiumViewportFit,
  distanceScale = 1,
): StadiumExplorePose {
  const distance = fit.cameraDistance * distanceScale
  // Aim above the ring mid so crest + cards sit lower between the chrome bars.
  const lookY = Math.max(0.75, contentAltitude * (fit.isPortrait ? 0.72 : 0.68))
  const camY = lookY + (fit.isPortrait ? 0.22 : 0.14)
  return {
    camera: new THREE.Vector3(0, camY, distance),
    look: new THREE.Vector3(0, lookY, 0),
  }
}

export function applyStadiumExploreFraming(
  contentAltitude: number,
  fit: StadiumViewportFit,
  cameraTarget: THREE.Vector3,
  lookTarget: THREE.Vector3,
  desiredCam?: THREE.Vector3,
  desiredLook?: THREE.Vector3,
  distanceScale = 1,
  /** When false, only set desired targets so the camera can lerp (close zoom-out). */
  snapLook = true,
): void {
  const pose = getStadiumExplorePose(contentAltitude, fit, distanceScale)
  cameraTarget.copy(pose.camera)
  desiredCam?.copy(pose.camera)
  desiredLook?.copy(pose.look)
  if (snapLook) lookTarget.copy(pose.look)
}


/** Gentle idle orbit used while nothing is selected. */
export function getStadiumIdleOrbitCam(
  contentAltitude: number,
  fit: StadiumViewportFit,
  orbit: number,
  out: THREE.Vector3,
  distanceScale = 1,
): THREE.Vector3 {
  const pose = getStadiumExplorePose(contentAltitude, fit, distanceScale)
  const distance = fit.cameraDistance * distanceScale
  return out.set(
    Math.sin(orbit) * distance,
    pose.camera.y + Math.sin(orbit * 0.5) * 0.12,
    Math.cos(orbit) * distance,
  )
}

/** Intro "lights" pull-back — same on every stadium chapter. */
export function getStadiumIntroLightsCam(
  contentAltitude: number,
  fit: StadiumViewportFit,
  out: THREE.Vector3,
  distanceScale = 1,
): THREE.Vector3 {
  const pose = getStadiumExplorePose(contentAltitude, fit, distanceScale)
  return out.set(0, pose.camera.y + 0.25, pose.camera.z + 0.45)
}
