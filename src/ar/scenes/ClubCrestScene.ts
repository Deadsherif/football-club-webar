import * as THREE from 'three'
import { BaseARScene, type ARSceneContext } from '@/ar/scenes/BaseARScene'
import { CLUB_CREST_SCENE } from '@/config/scenes'
import { assetLoader, type ProgressCallback } from '@/ar/assets/AssetLoader'
import { CrestGlow } from '@/ar/effects'
import { prepareStadiumModel } from '@/ar/effects/StadiumBuilder'
import { analytics } from '@/services/analyticsService'

/**
 * Crest scan displays the configured Al Ahly stadium as a rotating model
 * anchored directly to the physical crest, then unlocks the experience.
 */
export class ClubCrestScene extends BaseARScene {
  readonly id = CLUB_CREST_SCENE.id

  private root = new THREE.Group()
  private stadiumRoot = new THREE.Group()
  private glow = new CrestGlow()
  private stadium: THREE.Object3D | null = null
  private targetVisible = false
  private detectedOnce = false
  private experienceReady = false
  private readonly onProgress?: ProgressCallback

  constructor(onProgress?: ProgressCallback) {
    super()
    this.onProgress = onProgress
  }

  async setup(ctx: ARSceneContext): Promise<void> {
    this.ctx = ctx
    this.root.name = 'ClubCrestSceneRoot'
    this.stadiumRoot.name = 'ScannedStadium'
    ctx.anchorGroup.add(this.root)
    this.root.add(this.glow.group)
    this.root.add(this.stadiumRoot)
    this.root.visible = false
    this.stadiumRoot.visible = false

    this.addBaseLighting(ctx.scene)

    // Keep camera startup fast; the 73 MB GLB loads while the scanner is open.
    void this.loadStadium()
  }

  override onTargetFound(): void {
    super.onTargetFound()
    this.targetVisible = true
    this.root.visible = true
    this.glow.setActive(true)

    if (!this.detectedOnce) {
      this.detectedOnce = true
      analytics.targetDetected()
    }
    this.showStadiumIfReady()
  }

  override onTargetLost(): void {
    super.onTargetLost()
    this.targetVisible = false
    this.glow.setActive(false)
    this.stadiumRoot.visible = false
    this.root.visible = false
    if (!this.experienceReady) {
      this.emitCinematicPhase('idle')
    }
  }

  override update(deltaSeconds: number): void {
    if (!this.root.visible) return

    this.glow.setScriptedIntensity(
      this.trackingState === 'tracking' ? 0.85 : 0.25,
    )
    this.glow.update(deltaSeconds)

    if (!this.stadiumRoot.visible) return

    // A slow continuous turn gives a clear 360° stadium viewer on the crest.
    this.stadiumRoot.rotation.y =
      (this.stadiumRoot.rotation.y + deltaSeconds * 0.28) % (Math.PI * 2)
  }

  override dispose(): void {
    this.glow.dispose()
    this.stadiumRoot.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((m) => m.dispose())
      }
    })
    this.root.removeFromParent()
    super.dispose()
  }

  private async loadStadium(): Promise<void> {
    try {
      const stadium = await assetLoader.loadGLB(
        CLUB_CREST_SCENE.modelSrc,
        this.onProgress,
      )
      if (this.disposed) return

      // Normalize the model to the physical crest target.
      prepareStadiumModel(stadium, 1.05)
      stadium.name = 'ImportedScannedStadium'
      this.stadium = stadium
      this.stadiumRoot.add(stadium)
      this.showStadiumIfReady()
    } catch {
      // The AR experience remains usable and keeps scanning if the large
      // stadium model cannot be downloaded on the current connection.
      this.onProgress?.({ loaded: 1, total: 1, url: 'stadium-failed', ratio: 1 })
    }
  }

  private showStadiumIfReady(): void {
    if (!this.stadium || !this.targetVisible) return

    this.stadiumRoot.visible = true
    this.stadiumRoot.scale.setScalar(1)
    this.stadiumRoot.position.y = 0

    if (!this.experienceReady) {
      this.experienceReady = true
      analytics.stadiumLoaded()
      analytics.experienceCompleted()
    }
    this.emitCinematicPhase('complete')
  }

  private addBaseLighting(scene: THREE.Scene): void {
    if (scene.getObjectByName('ClubCrestAmbient')) return
    const ambient = new THREE.AmbientLight(0xffead2, 1.3)
    ambient.name = 'ClubCrestAmbient'
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0xfff5dc, 2.4)
    key.name = 'ClubCrestKeyLight'
    key.position.set(2.5, 4, 3)
    scene.add(key)

    const fill = new THREE.DirectionalLight(0xb9cffd, 0.9)
    fill.name = 'ClubCrestFillLight'
    fill.position.set(-2, 2, -2)
    scene.add(fill)
  }
}
