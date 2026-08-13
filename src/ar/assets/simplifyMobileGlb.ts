import * as THREE from 'three'

function disposeTexture(tex: THREE.Texture | null | undefined): void {
  tex?.dispose()
}

/**
 * Mobile-only GLB simplify: keep the cup mesh + color map, drop extra PBR
 * maps so 20–40MB trophies can display without killing the tab.
 */
export function simplifyObjectForMobile(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return

    const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
    const simplified: THREE.Material[] = []

    for (const mat of materials) {
      if (
        !(mat instanceof THREE.MeshStandardMaterial) &&
        !(mat instanceof THREE.MeshPhysicalMaterial)
      ) {
        simplified.push(mat)
        continue
      }

      const map = mat.map
      if (map) {
        map.anisotropy = 1
        map.generateMipmaps = false
        map.minFilter = THREE.LinearFilter
        map.magFilter = THREE.LinearFilter
        map.colorSpace = THREE.SRGBColorSpace
        map.needsUpdate = true
      }

      disposeTexture(mat.normalMap)
      disposeTexture(mat.roughnessMap)
      disposeTexture(mat.metalnessMap)
      disposeTexture(mat.aoMap)
      disposeTexture(mat.emissiveMap)
      disposeTexture(mat.bumpMap)
      mat.normalMap = null
      mat.roughnessMap = null
      mat.metalnessMap = null
      mat.aoMap = null
      mat.emissiveMap = null
      mat.bumpMap = null

      const lambert = new THREE.MeshLambertMaterial({
        color: mat.color,
        map,
        emissive: mat.emissive?.clone?.() ?? new THREE.Color(0x000000),
        emissiveIntensity: Math.min(0.3, mat.emissiveIntensity || 0),
        transparent: mat.transparent || mat.opacity < 0.99,
        opacity: mat.opacity,
      })
      mat.dispose()
      simplified.push(lambert)
    }

    obj.material = simplified.length === 1 ? simplified[0] : simplified
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
