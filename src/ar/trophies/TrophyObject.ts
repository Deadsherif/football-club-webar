import * as THREE from 'three'
import type { TrophyDefinition } from '@/data/trophies'
import { assetLoader } from '@/ar/assets/AssetLoader'

const TARGET_HEIGHT = 0.55

export interface TrophyAnimState {
  basePosition: THREE.Vector3
  baseRotation: THREE.Euler
  phase: number
  speed: number
  amplitude: number
}

/**
 * Floating trophy GLB with hover / select / dim states for raycasting.
 */
export class TrophyObject {
  readonly group = new THREE.Group()
  readonly hitProxy: THREE.Mesh
  readonly trophy: TrophyDefinition
  readonly anim: TrophyAnimState

  private hover = 0
  private targetHover = 0
  private select = 0
  private targetSelect = 0
  private brightness = 1
  private disposed = false
  private modelReady = false
  private baseScale = 1
  private readonly baseColors = new Map<THREE.Material, THREE.Color>()

  constructor(trophy: TrophyDefinition, anim: TrophyAnimState) {
    this.trophy = trophy
    this.anim = anim
    this.group.name = `Trophy_${trophy.id}`
    this.group.userData.trophyId = trophy.id

    // Invisible box for reliable raycasting before/while GLB loads.
    this.hitProxy = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.6, 0.35),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    )
    this.hitProxy.position.y = 0.3
    this.hitProxy.userData.trophyId = trophy.id
    this.group.add(this.hitProxy)

    this.group.position.copy(anim.basePosition)
    this.group.rotation.copy(anim.baseRotation)

    void this.loadModel()
  }

  setHovered(on: boolean): void {
    this.targetHover = on ? 1 : 0
  }

  setSelected(on: boolean): void {
    this.targetSelect = on ? 1 : 0
  }

  setDimmed(dim: boolean): void {
    this.brightness = dim ? 0.35 : 1
  }

  update(time: number, delta: number): void {
    if (this.disposed) return

    this.hover = THREE.MathUtils.damp(this.hover, this.targetHover, 8, delta)
    this.select = THREE.MathUtils.damp(this.select, this.targetSelect, 5, delta)

    const floatY =
      Math.sin(time * this.anim.speed + this.anim.phase) * this.anim.amplitude
    const breathe =
      Math.sin(time * (this.anim.speed * 0.7) + this.anim.phase) * 0.008

    const toward = this.hover * 0.12 + this.select * 0.4
    const scale =
      this.baseScale * (1 + this.hover * 0.08 + this.select * 0.28 + breathe)

    this.group.position.x = this.anim.basePosition.x
    this.group.position.y =
      this.anim.basePosition.y + floatY + this.select * 0.1
    this.group.position.z = this.anim.basePosition.z + toward

    this.group.rotation.x = this.anim.baseRotation.x
    this.group.rotation.y =
      this.anim.baseRotation.y +
      Math.sin(time * 0.35 + this.anim.phase) * 0.05 +
      this.hover * 0.06 +
      time * 0.15 * (0.15 + this.select * 0.35)
    this.group.rotation.z = this.anim.baseRotation.z

    if (this.modelReady) {
      this.group.scale.setScalar(scale)
    }

    this.applyBrightness()
  }

  dispose(): void {
    this.disposed = true
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
    this.group.removeFromParent()
  }

  private applyBrightness(): void {
    this.group.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of mats) {
        if ('color' in mat && mat.color instanceof THREE.Color) {
          const existing = this.baseColors.get(mat)
          const base = existing ?? mat.color.clone()
          if (!existing) this.baseColors.set(mat, base)
          mat.color.copy(base).multiplyScalar(this.brightness)
        }
      }
    })
  }

  private async loadModel(): Promise<void> {
    const scene = await assetLoader.loadGLB(this.trophy.modelSrc)
    if (this.disposed) return

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const height = Math.max(size.y, 0.001)
    const scale = TARGET_HEIGHT / height
    scene.scale.setScalar(scale)

    // Sit on the formation Y (origin at base).
    const scaledBox = new THREE.Box3().setFromObject(scene)
    scene.position.y = -scaledBox.min.y

    scene.traverse((obj) => {
      obj.userData.trophyId = this.trophy.id
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = false
        obj.receiveShadow = false
      }
    })

    this.group.add(scene)
    this.baseScale = 1
    this.modelReady = true

    // Resize hit proxy to match trophy.
    const hitBox = new THREE.Box3().setFromObject(scene)
    const hitSize = new THREE.Vector3()
    hitBox.getSize(hitSize)
    this.hitProxy.geometry.dispose()
    this.hitProxy.geometry = new THREE.BoxGeometry(
      Math.max(0.25, hitSize.x * 1.15),
      Math.max(0.35, hitSize.y * 1.05),
      Math.max(0.25, hitSize.z * 1.15),
    )
    this.hitProxy.position.y = hitSize.y * 0.5
  }
}
