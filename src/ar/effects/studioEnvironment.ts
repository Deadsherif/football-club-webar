import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Studio IBL so authored metalness/roughness + baseColor textures
 * read like a glTF viewer (not black without env lighting).
 */
export function attachStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  exposure = 1,
): () => void {
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const room = new RoomEnvironment()
  const envTexture = pmrem.fromScene(room, 0.04).texture
  scene.environment = envTexture
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = exposure

  return () => {
    if (scene.environment === envTexture) scene.environment = null
    envTexture.dispose()
    pmrem.dispose()
  }
}

/**
 * Keep GLB textures/material factors as authored — only fix color spaces.
 */
export function preserveSourceTextures(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]
    for (const mat of materials) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue

      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace
        mat.map.anisotropy = Math.max(mat.map.anisotropy, 4)
        mat.map.needsUpdate = true
      }
      if (mat.emissiveMap) {
        mat.emissiveMap.colorSpace = THREE.SRGBColorSpace
        mat.emissiveMap.needsUpdate = true
      }
      if (mat.normalMap) {
        mat.normalMap.anisotropy = Math.max(mat.normalMap.anisotropy, 4)
        mat.normalMap.needsUpdate = true
      }
      if (mat.metalnessMap) mat.metalnessMap.needsUpdate = true
      if (mat.roughnessMap) mat.roughnessMap.needsUpdate = true
      if (mat.aoMap) mat.aoMap.needsUpdate = true

      mat.envMapIntensity = 1
      mat.needsUpdate = true
    }
  })
}
