import * as THREE from 'three'
import { assetLoader, type ProgressCallback } from '@/ar/assets/AssetLoader'
import { CLUB_CREST_SCENE } from '@/config/scenes'
import {
  buildProceduralStadium,
  prepareStadiumModel,
} from '@/ar/effects/StadiumBuilder'
import { StadiumLights } from '@/ar/effects/StadiumLights'
import {
  computeArStadiumContentFit,
  type ArStadiumContentFit,
} from '@/ar/stadium/arContentFit'

export interface StadiumEnvironmentOptions {
  targetWidth: number
  onProgress?: ProgressCallback
  /** Skip the large stadium GLB (mobile trophies OOM guard). */
  preferProcedural?: boolean
}

/**
 * Shared stadium asset, atmosphere, lights, and content mount point.
 * Content modes add their cards to contentRoot; the GLB remains loaded once.
 */
export class StadiumEnvironment {
  readonly root = new THREE.Group()
  readonly stadiumRoot = new THREE.Group()
  readonly contentRoot = new THREE.Group()
  readonly lights = new StadiumLights()

  private cardsBaseHeight = 0
  private stadium: THREE.Object3D | null = null
  private arFit: ArStadiumContentFit | null = null
  private disposed = false

  constructor() {
    this.root.name = 'StadiumEnvironment'
    this.stadiumRoot.name = 'StadiumModel'
    this.contentRoot.name = 'StadiumContent'
    this.root.add(this.stadiumRoot, this.contentRoot)
  }

  async setup(options: StadiumEnvironmentOptions): Promise<void> {
    const stadium = await this.loadStadium(options)
    if (this.disposed) return

    this.stadium = stadium
    this.stadiumRoot.add(stadium)

    // Free-WebGL keeps cards high above the bowl; crest AR uses pitch fit.
    if (options.targetWidth <= 1.5) {
      this.arFit = computeArStadiumContentFit(stadium, options.targetWidth)
      this.cardsBaseHeight = this.arFit.contentHeight
    } else {
      this.arFit = null
    }

    this.contentRoot.position.y = this.cardsBaseHeight
    this.addAtmosphere(options.targetWidth)
  }

  get floatingCardAltitude(): number {
    return this.cardsBaseHeight
  }

  /** Present when stadium is sized for crest AR (`targetWidth` ~1). */
  get arContentFit(): ArStadiumContentFit | null {
    return this.arFit
  }

  get isReady(): boolean {
    return this.stadium !== null
  }

  setLightIntensity(value: number): void {
    this.lights.setIntensity(value)
  }

  setStadiumVisible(visible: boolean): void {
    this.stadiumRoot.visible = visible
  }

  update(_time: number, delta: number): void {
    this.lights.update(delta)
  }

  dispose(): void {
    this.disposed = true
    this.lights.dispose()
    if (this.stadium) {
      this.stadium.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        obj.geometry?.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const mat of materials) {
          if (!mat) continue
          for (const key of [
            'map',
            'normalMap',
            'roughnessMap',
            'metalnessMap',
            'aoMap',
            'emissiveMap',
          ] as const) {
            const tex = (mat as unknown as Record<string, unknown>)[key]
            if (tex instanceof THREE.Texture) tex.dispose()
          }
          mat.dispose()
        }
      })
      this.stadium = null
    }
    this.root.removeFromParent()
  }

  private async loadStadium(
    options: StadiumEnvironmentOptions,
  ): Promise<THREE.Object3D> {
    if (options.preferProcedural) {
      return this.buildProcedural(options)
    }

    try {
      const stadium = await assetLoader.loadGLB(
        CLUB_CREST_SCENE.modelSrc,
        options.onProgress,
      )
      prepareStadiumModel(stadium, options.targetWidth)
      const bounds = new THREE.Box3().setFromObject(stadium)
      this.cardsBaseHeight = bounds.max.y + options.targetWidth * 0.075
      stadium.name = 'ImportedStadium'
      return stadium
    } catch (error) {
      console.warn('[StadiumEnvironment] GLB load failed, using procedural stadium', error)
      return this.buildProcedural(options)
    }
  }

  private buildProcedural(options: StadiumEnvironmentOptions): THREE.Object3D {
    const fallback = buildProceduralStadium()
    fallback.scale.setScalar(options.targetWidth / 1.05)
    this.cardsBaseHeight = options.targetWidth * 0.1
    fallback.name = 'ProceduralStadiumFallback'
    options.onProgress?.({
      loaded: 1,
      total: 1,
      url: 'procedural-stadium',
      ratio: 1,
    })
    return fallback
  }

  private addAtmosphere(targetWidth = 1.05): void {
    this.lights.group.position.set(0, 0, 0)
    // Spot lights were authored for ~1-unit crest stadium; scale for free view.
    this.lights.group.scale.setScalar(Math.max(1, targetWidth / 1.05))
    this.root.add(this.lights.group)
    this.lights.setIntensity(0)

    // Soft fill lights — studio IBL carries most of the PBR look from source maps.
    const lightScale = Math.max(1, targetWidth)
    const ambient = new THREE.AmbientLight(0xffead2, 0.28)
    const key = new THREE.DirectionalLight(0xfff4dc, 0.85)
    const fill = new THREE.DirectionalLight(0xb8cffd, 0.35)
    const redWash = new THREE.PointLight(0xe30613, 0.4, 14 * lightScale, 2)
    const hemisphere = new THREE.HemisphereLight(0x6a7a9a, 0x1a0808, 0.22)

    ambient.name = 'StadiumAmbient'
    key.name = 'StadiumKeyLight'
    fill.name = 'StadiumFillLight'
    redWash.name = 'StadiumRedWash'
    key.position.set(3.5 * lightScale, 7 * lightScale, 4.5 * lightScale)
    fill.position.set(-4 * lightScale, 4 * lightScale, -3 * lightScale)
    redWash.position.set(0, 3.2 * lightScale, 0)
    this.root.add(ambient, key, fill, redWash, hemisphere)
  }
}
