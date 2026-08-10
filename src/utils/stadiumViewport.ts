/**
 * Stadium framing tuned for phone portrait vs tablet/desktop.
 * Portrait phones clip side cards unless FOV widens and the formation tightens.
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
      cameraDistance: 5.8,
      cameraHeight: 1.55,
      lookHeight: 0.95,
      formationScale: 0.62,
      cardScale: 0.82,
      minDistance: 2.4,
      maxDistance: 10,
      isPortrait: true,
    }
  }

  if (isPortrait) {
    return {
      fov: 60,
      cameraDistance: 5.2,
      cameraHeight: 1.4,
      lookHeight: 0.95,
      formationScale: 0.72,
      cardScale: 0.9,
      minDistance: 2.2,
      maxDistance: 9,
      isPortrait: true,
    }
  }

  return {
    fov: 50,
    cameraDistance: 4.2,
    cameraHeight: 1.2,
    lookHeight: 0.9,
    formationScale: 1,
    cardScale: 1,
    minDistance: 1.8,
    maxDistance: 8,
    isPortrait: false,
  }
}
