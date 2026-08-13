import * as THREE from 'three'

function disposeTexture(tex: THREE.Texture | null | undefined): void {
  tex?.dispose()
}

function prepareColorMap(map: THREE.Texture | null): void {
  if (!map) return
  map.anisotropy = 1
  map.generateMipmaps = true
  map.minFilter = THREE.LinearMipmapLinearFilter
  map.magFilter = THREE.LinearFilter
  map.colorSpace = THREE.SRGBColorSpace
  map.needsUpdate = true
}

/**
 * Mobile-only: keep the real GLB mesh + color/emissive textures, drop extra
 * PBR maps so cups still look textured without the full desktop memory cost.
 */
export function simplifyObjectForMobile(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return

    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]

    for (const mat of materials) {
      if (
        !(mat instanceof THREE.MeshStandardMaterial) &&
        !(mat instanceof THREE.MeshPhysicalMaterial)
      ) {
        continue
      }

      prepareColorMap(mat.map)
      prepareColorMap(mat.emissiveMap)

      disposeTexture(mat.normalMap)
      disposeTexture(mat.roughnessMap)
      disposeTexture(mat.metalnessMap)
      disposeTexture(mat.aoMap)
      disposeTexture(mat.bumpMap)
      mat.normalMap = null
      mat.roughnessMap = null
      mat.metalnessMap = null
      mat.aoMap = null
      mat.bumpMap = null

      if (mat instanceof THREE.MeshPhysicalMaterial) {
        disposeTexture(mat.clearcoatMap)
        disposeTexture(mat.clearcoatNormalMap)
        disposeTexture(mat.clearcoatRoughnessMap)
        mat.clearcoatMap = null
        mat.clearcoatNormalMap = null
        mat.clearcoatRoughnessMap = null
      }

      // Keep metal look, but not so chrome that color textures disappear.
      mat.metalness = Math.min(mat.metalness, 0.72)
      mat.roughness = Math.max(mat.roughness, 0.28)
      mat.envMapIntensity = 1
      mat.needsUpdate = true
    }

    obj.castShadow = false
    obj.receiveShadow = false

    const geom = obj.geometry
    if (geom) {
      geom.morphAttributes = {}
      geom.morphTargetsRelative = false
      if (geom.hasAttribute('tangent')) geom.deleteAttribute('tangent')
      if (geom.hasAttribute('uv2')) geom.deleteAttribute('uv2')
    }
  })
}
