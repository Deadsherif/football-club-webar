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
  options: { textures?: boolean } = { textures: true },
): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    obj.geometry?.dispose()
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of materials) {
      if (!mat) continue
      if (options.textures !== false) {
        for (const key of TEXTURE_KEYS) {
          const tex = (mat as unknown as Record<string, unknown>)[key]
          if (tex instanceof THREE.Texture) tex.dispose()
        }
      }
      mat.dispose()
    }
  })
}
