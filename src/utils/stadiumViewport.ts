/**
 * Stadium framing tuned for phone portrait vs tablet/desktop.
 * Portrait phones clip side cards unless FOV widens and the formation tightens.
 * Sized so focused cards sit between journey top tabs and bottom transport.
 */
export interface StadiumViewportFit {
  fov: number
  cameraDistance: number
  cameraHeight: number
  lookHeight: number
  formationScale: number
  cardScale: number
  minDistance: number
  maxDistance: number
  isPortrait: boolean
}

export function getStadiumViewportFit(
  width = typeof window !== 'undefined' ? window.innerWidth : 390,
  height = typeof window !== 'undefined' ? window.innerHeight : 844,
): StadiumViewportFit {
  const aspect = width / Math.max(1, height)
  const isPortrait = aspect < 0.85
  const isNarrowPhone = isPortrait && width < 430

  if (isNarrowPhone) {
    return {
      fov: 68,
      cameraDistance: 7.0,
      cameraHeight: 0.55,
      lookHeight: 0.2,
      formationScale: 0.58,
      cardScale: 1.0,
      minDistance: 2.6,
      maxDistance: 14,
      isPortrait: true,
    }
  }

  if (isPortrait) {
    return {
      fov: 60,
      cameraDistance: 6.4,
      cameraHeight: 0.5,
      lookHeight: 0.2,
      formationScale: 0.68,
      cardScale: 1.1,
      minDistance: 2.4,
      maxDistance: 13,
      isPortrait: true,
    }
  }

  return {
    fov: 50,
    cameraDistance: 5.8,
    cameraHeight: 0.45,
    lookHeight: 0.2,
    formationScale: 0.95,
    cardScale: 1.15,
    minDistance: 2.2,
    maxDistance: 12,
    isPortrait: false,
  }
}
