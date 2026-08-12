import * as THREE from 'three'

/**
 * Cinematic stadium/crest entrance: rises from below while spinning into rest pose.
 * `t` is intro progress 0→1 (lights + reveal).
 */
export function applyStadiumIntroFlight(
  stadiumRoot: THREE.Object3D,
  t: number,
): void {
  const u = THREE.MathUtils.clamp(t, 0, 1)
  // Ease-out cubic — settles into place before cards finish revealing.
  const ease = 1 - (1 - Math.min(1, u * 1.15)) ** 3
  // Rest smaller so the full model + flying cards fit one viewport (phone + PC).
  const restScale = 0.58
  stadiumRoot.position.set(
    0,
    THREE.MathUtils.lerp(-2.2, 0, ease),
    THREE.MathUtils.lerp(1.1, 0, ease),
  )
  stadiumRoot.scale.setScalar(THREE.MathUtils.lerp(0.1, restScale, ease))
  stadiumRoot.rotation.set(0, (1 - ease) * Math.PI * 1.35, 0)
}

export function resetStadiumIntroFlight(stadiumRoot: THREE.Object3D): void {
  stadiumRoot.position.set(0, 0, 0)
  stadiumRoot.rotation.set(0, 0, 0)
  // Keep explore backdrop modest so cabinet + model stay in frame.
  stadiumRoot.scale.setScalar(0.62)
}

/**
 * Journey split: small model left + card/trophy right.
 * Sized so both columns clear top tabs and bottom transport on phone + PC.
 */
export function getJourneySplitLayout(
  portrait: boolean,
  compactModel: boolean,
  stacked = false,
) {
  return {
    modelX: portrait ? -0.38 : -0.58,
    itemX: portrait ? 0.4 : 0.62,
    itemY: portrait ? 0.02 : 0.04,
    itemZ: portrait ? 0.12 : 0.16,
    // Stacked crest+stadium is taller — keep it a bit smaller than a single crest.
    modelScale: stacked
      ? portrait
        ? 0.17
        : 0.2
      : compactModel
        ? portrait
          ? 0.2
          : 0.24
        : portrait
          ? 0.055
          : 0.07,
  }
}
