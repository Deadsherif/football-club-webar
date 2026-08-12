import * as THREE from 'three'

const TEXTURE_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'emissiveMap',
  'bumpMap',
  'displacementMap',
  'alphaMap',
  'envMap',
  'lightMap',
] as const

/**
 * Release GPU resources for a scene graph. Optionally skip textures when they
 * are still owned by an AssetLoader cache entry.
 */
export function disposeObject3D(
  root: THREE.Object3D,
  options: { textures?: boolean; geometry?: boolean } = {
    textures: true,
    geometry: true,
  },
): void {
  const disposeTextures = options.textures !== false
  const disposeGeometry = options.geometry !== false
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    if (disposeGeometry) obj.geometry?.dispose()
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of materials) {
      if (!mat) continue
      if (disposeTextures) {
        for (const key of TEXTURE_KEYS) {
          const tex = (mat as unknown as Record<string, unknown>)[key]
          if (tex instanceof THREE.Texture) tex.dispose()
        }
      }
      mat.dispose()
    }
  })
}
