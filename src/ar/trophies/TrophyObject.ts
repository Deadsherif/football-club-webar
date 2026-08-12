import * as THREE from 'three'
import type { TrophyDefinition } from '@/data/trophies'
import { assetLoader } from '@/ar/assets/AssetLoader'
import { preserveSourceTextures } from '@/ar/effects/studioEnvironment'
import { disposeObject3D } from '@/ar/trophies/disposeObject3D'

const TARGET_HEIGHT = 0.55
const _homeWorld = new THREE.Vector3()
const _camWorld = new THREE.Vector3()
const _pulled = new THREE.Vector3()

export interface TrophyAnimState {
  basePosition: THREE.Vector3
  baseRotation: THREE.Euler
  phase: number
  speed: number
  amplitude: number
}

export interface TrophyLoadOptions {
  maxTextureWidth?: number
}

/**
 * Floating trophy with a lightweight placeholder until its GLB is requested.
 * Mobile keeps only a few resident models to avoid tab OOM kills.
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
  private dim = 0
  private targetDim = 0
  private disposed = false
  private modelReady = false
  private modelRoot: THREE.Object3D | null = null
  private placeholder: THREE.Group
  private loadPromise: Promise<void> | null = null
  private baseScale = 1
  private readonly baseColors = new Map<THREE.Material, THREE.Color>()
  private readonly baseOpacities = new Map<THREE.Material, number>()
  private readonly baseEnvIntensity = new Map<THREE.Material, number>()
  private focusCamera: THREE.Camera | null = null
  private focusScaleBoost = 0.1
  private focusPull = 0
  private maxTextureWidth = 2048
  private entry = 1
  private targetEntry = 1
  private stageHome: THREE.Vector3 | null = null
  private readonly homeLocal = new THREE.Vector3()
  /** Bumped on unload/dispose so in-flight loads discard their result. */
  private loadGeneration = 0

  constructor(trophy: TrophyDefinition, anim: TrophyAnimState) {
    this.trophy = trophy
    this.anim = anim
    this.group.name = `Trophy_${trophy.id}`
    this.group.userData.trophyId = trophy.id

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

    this.placeholder = this.createPlaceholder()
    this.group.add(this.placeholder)

    this.group.position.copy(anim.basePosition)
    this.group.rotation.copy(anim.baseRotation)
    this.baseScale = 1
    // Placeholder only until GLB loads — keep modelReady false so the
    // cup silhouette stays visible on mobile (1–2 resident models).
    this.modelReady = false
  }

  get hasModel(): boolean {
    return this.modelRoot !== null
  }

  get isLoading(): boolean {
    return this.loadPromise !== null && this.modelRoot === null
  }

  setLoadOptions(options: TrophyLoadOptions): void {
    if (typeof options.maxTextureWidth === 'number') {
      this.maxTextureWidth = options.maxTextureWidth
    }
  }

  /** Load the authored GLB once; safe to call repeatedly. Retries once on failure. */
  ensureModel(): Promise<void> {
    if (this.disposed) return Promise.resolve()
    if (this.modelRoot) return Promise.resolve()
    if (this.loadPromise) {
      // Previous load may have been cancelled by unload — chain a fresh attempt.
      return this.loadPromise.then(() => this.ensureModel())
    }

    const generation = this.loadGeneration
    this.loadPromise = this.loadModelWithRetry(generation).finally(() => {
      this.loadPromise = null
    })
    return this.loadPromise
  }

  /** Drop the GLB and restore the placeholder to free memory. */
  unloadModel(): void {
    this.loadGeneration += 1
    if (!this.modelRoot) {
      this.modelReady = false
      this.placeholder.visible = true
      return
    }
    this.group.remove(this.modelRoot)
    disposeObject3D(this.modelRoot, { textures: false, geometry: false })
    this.modelRoot = null
    this.modelReady = false
    this.placeholder.visible = true
    this.baseColors.clear()
    this.baseOpacities.clear()
    this.baseEnvIntensity.clear()
  }

  /** Force the cup into the cabinet after journey select (intro may not have revealed it). */
  revealForFocus(): void {
    this.group.visible = true
    this.snapIn()
    const targetScale =
      typeof this.group.userData.targetScale === 'number'
        ? this.group.userData.targetScale
        : this.baseScale
    this.group.scale.setScalar(Math.max(0.01, targetScale))
    if (this.modelRoot) {
      this.modelRoot.visible = true
      this.placeholder.visible = false
      this.modelReady = true
    } else {
      this.placeholder.visible = true
      this.modelReady = false
    }
  }

  setHovered(on: boolean): void {
    this.targetHover = on ? 1 : 0
  }

  setSelected(on: boolean): void {
    this.targetSelect = on ? 1 : 0
  }

  setDimmed(dim: boolean): void {
    this.targetDim = dim ? 1 : 0
  }

  setFocusCamera(camera: THREE.Camera | null): void {
    this.focusCamera = camera
  }

  /** Pin selected trophy to journey split stage. */
  setStageHome(pos: THREE.Vector3 | null): void {
    this.stageHome = pos ? pos.clone() : null
  }

  beginFlyIn(): void {
    this.entry = 0
    this.targetEntry = 1
  }

  snapIn(): void {
    this.entry = 1
    this.targetEntry = 1
  }

  /** Stronger select zoom for crest AR (camera cannot dolly). */
  configureArFocus(boost: number, pull: number): void {
    this.focusScaleBoost = boost
    this.focusPull = pull
  }

  /** True when not driving select-scale (reveal ease can own scale briefly). */
  get isIdleScale(): boolean {
    return this.targetSelect < 0.5 && this.select < 0.08
  }

  update(time: number, delta: number): void {
    if (this.disposed) return

    this.hover = THREE.MathUtils.damp(this.hover, this.targetHover, 8, delta)
    this.select = THREE.MathUtils.damp(this.select, this.targetSelect, 5, delta)
    this.dim = THREE.MathUtils.damp(this.dim, this.targetDim, 7, delta)
    this.entry = THREE.MathUtils.damp(this.entry, this.targetEntry, 2.8, delta)

    const focusing = this.targetSelect > 0.5 || this.select > 0.08
    const motion = focusing ? 0 : 1

    const floatY =
      Math.sin(time * this.anim.speed + this.anim.phase) *
      this.anim.amplitude *
      motion
    const breathe =
      Math.sin(time * (this.anim.speed * 0.7) + this.anim.phase) *
      0.008 *
      motion

    const toward = (this.hover * 0.12 + this.select * 0.18) * motion
    const base =
      typeof this.group.userData.targetScale === 'number'
        ? this.group.userData.targetScale
        : this.baseScale
    const scale =
      base *
      Math.max(0.01, this.entry) *
      (1 + this.hover * 0.08 + this.select * this.focusScaleBoost + breathe)

    const entryY = (1 - this.entry) * 1.05
    if (focusing && this.stageHome) {
      this.homeLocal.copy(this.stageHome)
    } else {
      this.homeLocal.set(
        this.anim.basePosition.x,
        this.anim.basePosition.y + entryY + (focusing ? this.select * 0.08 : 0),
        this.anim.basePosition.z + toward,
      )
    }

    this.group.position.copy(this.homeLocal)
    if (!focusing) this.group.position.y += floatY

    if (focusing && this.focusPull > 0 && this.focusCamera && this.group.parent) {
      _homeWorld.copy(this.group.position)
      this.group.parent.localToWorld(_homeWorld)
      this.focusCamera.getWorldPosition(_camWorld)
      _pulled.subVectors(_camWorld, _homeWorld)
      if (_pulled.lengthSq() > 1e-6) {
        _pulled.normalize().multiplyScalar(this.select * this.focusPull)
        _pulled.add(_homeWorld)
        this.group.parent.worldToLocal(_pulled)
        this.group.position.copy(_pulled)
      }
    }

    this.group.rotation.x = this.anim.baseRotation.x
    this.group.rotation.y =
      this.anim.baseRotation.y +
      Math.sin(time * 0.35 + this.anim.phase) * 0.05 * motion +
      this.hover * 0.06 +
      time * 0.15 * (0.15 + this.select * 0.35)
    this.group.rotation.z = this.anim.baseRotation.z

    this.group.scale.setScalar(Math.max(0.001, scale))

    // Fully dimmed trophies stay out of the way (no depth / draw cost covering focus).
    const hideForFocus = this.targetDim > 0.5 && this.dim > 0.88
    if (this.modelRoot) this.modelRoot.visible = !hideForFocus
    this.placeholder.visible = !this.modelReady && !hideForFocus

    this.applyDim()
  }

  dispose(): void {
    this.disposed = true
    this.loadGeneration += 1
    this.unloadModel()
    disposeObject3D(this.placeholder, { textures: true })
    this.hitProxy.geometry.dispose()
    ;(this.hitProxy.material as THREE.Material).dispose()
    this.group.removeFromParent()
    this.baseColors.clear()
    this.baseOpacities.clear()
    this.baseEnvIntensity.clear()
  }

  private createPlaceholder(): THREE.Group {
    const root = new THREE.Group()
    root.name = 'TrophyPlaceholder'

    const gold = new THREE.MeshStandardMaterial({
      color: 0xc9a227,
      metalness: 0.85,
      roughness: 0.35,
      envMapIntensity: 1,
      transparent: true,
      opacity: 1,
    })
    const dark = new THREE.MeshStandardMaterial({
      color: 0x3a2410,
      metalness: 0.4,
      roughness: 0.55,
      transparent: true,
      opacity: 1,
    })

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.22, 16), gold)
    cup.position.y = 0.28
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.14, 12), gold)
    stem.position.y = 0.14
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16), dark)
    base.position.y = 0.03
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 20), gold)
    rim.rotation.x = Math.PI / 2
    rim.position.y = 0.39

    for (const mesh of [cup, stem, base, rim]) {
      mesh.userData.trophyId = this.trophy.id
      mesh.castShadow = false
      mesh.receiveShadow = false
      root.add(mesh)
    }
    return root
  }

  private applyDim(): void {
    // Fade all the way out so dimmed trophies cannot cover the selected one
    // (semi-transparent meshes still occlude when depthWrite stays on).
    const brightness = 1 - this.dim * 0.88
    const opacity = Math.max(0, 1 - this.dim)
    const envScale = 1 - this.dim * 0.92
    const writeDepth = this.dim < 0.04
    const selected = this.targetSelect > 0.5 || this.select > 0.2

    this.group.renderOrder = selected ? 20 : this.dim > 0.2 ? -5 : 0
    this.hitProxy.visible = this.dim < 0.5

    this.group.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || obj === this.hitProxy) return
      obj.renderOrder = this.group.renderOrder
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of mats) {
        if (!mat) continue

        if ('color' in mat && mat.color instanceof THREE.Color) {
          const existing = this.baseColors.get(mat)
          const base = existing ?? mat.color.clone()
          if (!existing) this.baseColors.set(mat, base)
          mat.color.copy(base).multiplyScalar(brightness)
        }

        if ('opacity' in mat && typeof mat.opacity === 'number') {
          if (!this.baseOpacities.has(mat)) {
            this.baseOpacities.set(mat, mat.opacity)
          }
          const baseOpacity = this.baseOpacities.get(mat) ?? 1
          mat.transparent = true
          mat.opacity = baseOpacity * opacity
          mat.depthWrite = writeDepth && mat.opacity > 0.92
          mat.depthTest = true
          mat.needsUpdate = true
        }

        if (
          mat instanceof THREE.MeshStandardMaterial &&
          typeof mat.envMapIntensity === 'number'
        ) {
          if (!this.baseEnvIntensity.has(mat)) {
            this.baseEnvIntensity.set(mat, mat.envMapIntensity)
          }
          const baseEnv = this.baseEnvIntensity.get(mat) ?? 1
          mat.envMapIntensity = baseEnv * envScale
        }
      }
    })
  }

  private async loadModelWithRetry(generation: number): Promise<void> {
    try {
      await this.loadModel(generation)
    } catch (error) {
      if (this.disposed || generation !== this.loadGeneration) return
      console.warn('[TrophyObject] Load failed, retrying once', this.trophy.id, error)
      await new Promise((r) => setTimeout(r, 280))
      if (this.disposed || generation !== this.loadGeneration) return
      await this.loadModel(generation)
    }
  }

  private async loadModel(generation: number): Promise<void> {
    const scene = await assetLoader.loadGLB(this.trophy.modelSrc, undefined, {
      maxTextureWidth: this.maxTextureWidth,
    })
    if (this.disposed || generation !== this.loadGeneration) {
      disposeObject3D(scene, { textures: true })
      return
    }

    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const height = Math.max(size.y, 0.001)
    const scale = TARGET_HEIGHT / height
    scene.scale.setScalar(scale)

    const scaledBox = new THREE.Box3().setFromObject(scene)
    scene.position.y = -scaledBox.min.y

    scene.traverse((obj) => {
      obj.userData.trophyId = this.trophy.id
      if (!(obj instanceof THREE.Mesh)) return
      obj.castShadow = false
      obj.receiveShadow = false
      obj.visible = true
    })
    preserveSourceTextures(scene)

    // Replace any stale attach from a racing load.
    if (this.modelRoot) {
      this.group.remove(this.modelRoot)
      disposeObject3D(this.modelRoot, { textures: false, geometry: false })
    }

    this.placeholder.visible = false
    this.group.add(scene)
    this.modelRoot = scene
    this.baseScale = 1
    this.modelReady = true
    this.group.visible = true

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
