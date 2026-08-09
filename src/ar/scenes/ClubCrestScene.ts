import * as THREE from 'three'
import { BaseARScene, type ARSceneContext } from '@/ar/scenes/BaseARScene'
import { assetLoader } from '@/ar/assets/AssetLoader'
import { CLUB_CREST_SCENE } from '@/config/scenes'
import type { ProgressCallback } from '@/ar/assets/AssetLoader'
import {
  CrestGlow,
  SparkParticles,
  PortalRing,
  StadiumLights,
  CinematicTimeline,
  buildProceduralStadium,
  prepareStadiumModel,
  easeOutCubic,
  easeOutBack,
  lerp,
} from '@/ar/effects'
import { analytics } from '@/services/analyticsService'

/**
 * Crest detection → cinematic portal → stadium reveal.
 * All 3D content stays parented to the MindAR image anchor.
 */
export class ClubCrestScene extends BaseARScene {
  readonly id = CLUB_CREST_SCENE.id

  private root = new THREE.Group()
  private cinematicRig = new THREE.Group()
  private stadiumRoot = new THREE.Group()
  private stadium: THREE.Object3D | null = null

  private glow = new CrestGlow()
  private particles = new SparkParticles()
  private portal = new PortalRing()
  private lights = new StadiumLights()
  private timeline = new CinematicTimeline()

  private baseAmbient: THREE.AmbientLight | null = null
  private baseKey: THREE.DirectionalLight | null = null
  private stadiumBaseY = 0.12
  private hasPlayed = false

  private readonly onProgress?: ProgressCallback

  constructor(onProgress?: ProgressCallback) {
    super()
    this.onProgress = onProgress
  }

  async setup(ctx: ARSceneContext): Promise<void> {
    this.ctx = ctx
    this.root.name = 'ClubCrestSceneRoot'
    this.cinematicRig.name = 'CinematicRig'
    this.stadiumRoot.name = 'StadiumRoot'

    ctx.anchorGroup.add(this.root)
    this.root.add(this.glow.group)
    this.root.add(this.particles.points)
    this.root.add(this.portal.group)
    this.root.add(this.cinematicRig)
    this.cinematicRig.add(this.stadiumRoot)
    this.stadiumRoot.add(this.lights.group)

    this.addBaseLighting(ctx.scene)
    this.stadium = await this.loadStadium()
    this.stadiumRoot.add(this.stadium)

    // Start hidden below the portal aperture.
    this.stadiumRoot.position.y = -0.85
    this.stadiumRoot.scale.setScalar(0.15)
    this.stadiumRoot.visible = false
    this.root.visible = false

    this.timeline.setPhaseListener((phase) => this.emitCinematicPhase(phase))
  }

  override onTargetFound(): void {
    super.onTargetFound()
    this.root.visible = true

    if (!this.hasPlayed) {
      this.hasPlayed = true
      this.timeline.start()
      this.glow.setActive(true)
      analytics.targetDetected()
    } else {
      // Re-acquire after loss: keep stadium visible, soft glow only.
      this.timeline.stop()
      this.glow.setActive(true)
      this.stadiumRoot.visible = true
      this.stadiumRoot.position.y = this.stadiumBaseY
      this.stadiumRoot.scale.setScalar(1)
      this.portal.setOpen(1)
      this.lights.setEnabled(true)
      this.emitCinematicPhase('complete')
    }
  }

  override onTargetLost(): void {
    super.onTargetLost()
    this.glow.setActive(false)
    this.emitCinematicPhase('idle')
  }

  override update(deltaSeconds: number): void {
    if (!this.root.visible) return

    const beats = this.timeline.update(deltaSeconds)

    if (beats.justParticles) {
      this.particles.burst()
    }

    if (beats.justTitle) {
      analytics.stadiumLoaded()
    }

    this.glow.setScriptedIntensity(
      this.timeline.isPlaying ? beats.glow : this.trackingState === 'tracking' ? 0.75 : 0.2,
    )
    this.glow.update(deltaSeconds)
    this.particles.update(deltaSeconds)
    this.portal.setOpen(this.timeline.isPlaying ? beats.portal : this.hasPlayed ? 1 : 0)
    this.portal.update(deltaSeconds)

    if (beats.stadiumRise > 0 || (this.hasPlayed && !this.timeline.isPlaying)) {
      this.stadiumRoot.visible = true
      if (this.timeline.isPlaying) {
        const rise = easeOutCubic(beats.stadiumRise)
        this.stadiumRoot.position.y = lerp(-0.85, this.stadiumBaseY, rise)
        this.stadiumRoot.scale.setScalar(lerp(0.15, 1, easeOutBack(Math.min(1, beats.stadiumRise * 1.05))))
        // Subtle cinematic pitch as it emerges from the portal.
        this.stadiumRoot.rotation.x = lerp(0.35, 0, rise)
      }
    }

    this.lights.setIntensity(
      this.timeline.isPlaying ? beats.lights : this.hasPlayed ? 1 : 0,
    )
    this.lights.update(deltaSeconds)

    if (this.timeline.isPlaying) {
      // Camera-like orbit: content orbits under the tracked crest.
      const orbitT = beats.orbit
      this.cinematicRig.rotation.y = lerp(0.55, 0.08, easeOutCubic(orbitT))
      this.cinematicRig.position.y = Math.sin(orbitT * Math.PI) * 0.04
      this.cinematicRig.scale.setScalar(lerp(0.92, 1, easeOutCubic(orbitT)))
    } else if (this.hasPlayed) {
      this.cinematicRig.rotation.y += deltaSeconds * 0.08
    }

    // Dim base lights as stadium floodlights take over.
    if (this.baseAmbient && this.baseKey) {
      const flood = this.timeline.isPlaying ? beats.lights : this.hasPlayed ? 1 : 0
      this.baseAmbient.intensity = lerp(0.7, 0.25, flood)
      this.baseKey.intensity = lerp(0.9, 0.2, flood)
    }
  }

  override dispose(): void {
    this.timeline.stop()
    this.glow.dispose()
    this.particles.dispose()
    this.portal.dispose()
    this.lights.dispose()

    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach((m) => m.dispose())
      }
    })
    this.root.removeFromParent()

    if (this.baseAmbient) {
      this.baseAmbient.removeFromParent()
      this.baseAmbient = null
    }
    if (this.baseKey) {
      this.baseKey.removeFromParent()
      this.baseKey = null
    }

    super.dispose()
  }

  private async loadStadium(): Promise<THREE.Object3D> {
    try {
      const model = await assetLoader.loadGLB(CLUB_CREST_SCENE.modelSrc, this.onProgress)
      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3()
      box.getSize(size)
      // Khronos box / tiny placeholders → use procedural premium stadium
      if (Math.max(size.x, size.y, size.z) < 3) {
        this.onProgress?.({ loaded: 1, total: 1, url: 'procedural-stadium', ratio: 1 })
        return buildProceduralStadium()
      }
      prepareStadiumModel(model)
      return model
    } catch {
      this.onProgress?.({ loaded: 1, total: 1, url: 'procedural-stadium', ratio: 1 })
      return buildProceduralStadium()
    }
  }

  private addBaseLighting(scene: THREE.Scene): void {
    if (scene.getObjectByName('ClubCrestAmbient')) return

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    ambient.name = 'ClubCrestAmbient'
    scene.add(ambient)
    this.baseAmbient = ambient

    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.name = 'ClubCrestKey'
    key.position.set(0.6, 1.4, 0.8)
    scene.add(key)
    this.baseKey = key
  }
}
