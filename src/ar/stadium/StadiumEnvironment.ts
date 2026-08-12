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

export type StadiumBackdropKind = 'primary' | 'alternate' | 'stacked'

export interface StadiumEnvironmentOptions {
  targetWidth: number
  onProgress?: ProgressCallback
  /** Skip the large stadium GLB (mobile trophies OOM guard). */
  preferProcedural?: boolean
  /** Cap decoded texture width for the backdrop GLB. */
  maxTextureWidth?: number
  /** Override the primary backdrop GLB (defaults to stadium). */
  modelSrc?: string
  /**
   * Optional second backdrop (e.g. stadium) swapped in on demand.
   * Loaded lazily the first time setBackdrop('alternate') is used.
   */
  alternateModelSrc?: string
  /** Scale for the alternate backdrop (defaults to targetWidth). */
  alternateTargetWidth?: number
}

/**
 * Shared stadium/crest asset, atmosphere, lights, and content mount point.
 * Content modes add their cards to contentRoot; the GLB remains loaded once.
 */
export class StadiumEnvironment {
  readonly root = new THREE.Group()
  readonly stadiumRoot = new THREE.Group()
  readonly contentRoot = new THREE.Group()
  readonly lights = new StadiumLights()

  private cardsBaseHeight = 0
  private primary: THREE.Object3D | null = null
  private alternate: THREE.Object3D | null = null
  private readonly primaryWrap = new THREE.Group()
  private readonly alternateWrap = new THREE.Group()
  private readonly _box = new THREE.Box3()
  private readonly _size = new THREE.Vector3()
  private readonly _center = new THREE.Vector3()
  private activeBackdrop: StadiumBackdropKind = 'primary'
  private primaryHeight = 0
  private alternateHeight = 0
  private arFit: ArStadiumContentFit | null = null
  private disposed = false
  private targetWidth = 1.05
  private alternateTargetWidth = 1.05
  private alternateModelSrc: string | null = null
  private alternateLoad: Promise<void> | null = null
  private maxTextureWidth: number | null = null

  constructor() {
    this.root.name = 'StadiumEnvironment'
    this.stadiumRoot.name = 'StadiumModel'
    this.contentRoot.name = 'StadiumContent'
    this.primaryWrap.name = 'PrimaryBackdropWrap'
    this.alternateWrap.name = 'AlternateBackdropWrap'
    this.stadiumRoot.add(this.primaryWrap, this.alternateWrap)
    this.root.add(this.stadiumRoot, this.contentRoot)
  }

  async setup(options: StadiumEnvironmentOptions): Promise<void> {
    this.targetWidth = options.targetWidth
    this.alternateTargetWidth = options.alternateTargetWidth ?? options.targetWidth
    this.alternateModelSrc = options.alternateModelSrc ?? null
    this.maxTextureWidth = options.maxTextureWidth ?? null

    const primary = await this.loadModel(
      options.preferProcedural
        ? null
        : (options.modelSrc ?? CLUB_CREST_SCENE.modelSrc),
      options,
      'ImportedBackdrop',
      options.targetWidth,
    )
    if (this.disposed) return

    this.primary = primary
    this.primaryWrap.add(primary)
    this.primaryHeight = this.measureCardAltitude(primary, options.targetWidth)
    this.cardsBaseHeight = this.primaryHeight
    this.activeBackdrop = 'primary'

    // Free-WebGL keeps cards high above the bowl; crest AR uses pitch fit.
    if (options.targetWidth <= 1.5) {
      this.arFit = computeArStadiumContentFit(primary, options.targetWidth)
      this.cardsBaseHeight = this.arFit.contentHeight
      this.primaryHeight = this.cardsBaseHeight
    } else {
      this.arFit = null
    }

    this.contentRoot.position.y = this.cardsBaseHeight
    this.addAtmosphere(options.targetWidth)
  }

  get floatingCardAltitude(): number {
    return this.cardsBaseHeight
  }

  /**
   * Force the floating content height (keeps crest/stadium visual, matches
   * trophies camera framing across free-WebGL cabinets).
   */
  setContentAltitude(y: number): void {
    this.cardsBaseHeight = y
    this.contentRoot.position.y = y
  }

  /** Load alternate backdrop if needed and return its card altitude. */
  async prefetchAlternateAltitude(): Promise<number> {
    await this.ensureAlternate()
    return this.alternateHeight
  }

  /** Present when stadium is sized for crest AR (`targetWidth` ~1). */
  get arContentFit(): ArStadiumContentFit | null {
    return this.arFit
  }

  get isReady(): boolean {
    return this.primary !== null
  }

  get backdrop(): StadiumBackdropKind {
    return this.activeBackdrop
  }

  setLightIntensity(value: number): void {
    this.lights.setIntensity(value)
  }

  setStadiumVisible(visible: boolean): void {
    this.stadiumRoot.visible = visible
  }

  /**
   * Swap between crest, stadium, or both stacked (crest above stadium).
   * Alternate is loaded on first use.
   */
  async setBackdrop(kind: StadiumBackdropKind): Promise<void> {
    if (this.disposed || kind === this.activeBackdrop) return

    if (kind === 'stacked') {
      await this.ensureAlternate()
      if (this.disposed || !this.alternate || !this.primary) return
      this.primary.visible = true
      this.alternate.visible = true
      this.layoutStacked()
      this.cardsBaseHeight = this.primaryHeight
    } else if (kind === 'alternate') {
      await this.ensureAlternate()
      if (this.disposed || !this.alternate) return
      this.resetWraps()
      if (this.primary) this.primary.visible = false
      this.alternate.visible = true
      this.cardsBaseHeight = this.alternateHeight
    } else {
      this.resetWraps()
      if (this.alternate) this.alternate.visible = false
      if (this.primary) this.primary.visible = true
      this.cardsBaseHeight = this.primaryHeight
    }

    this.activeBackdrop = kind
    this.contentRoot.position.y = this.cardsBaseHeight
  }

  update(_time: number, delta: number): void {
    this.lights.update(delta)
  }

  dispose(): void {
    this.disposed = true
    this.lights.dispose()
    this.disposeObject(this.primary)
    this.disposeObject(this.alternate)
    this.primary = null
    this.alternate = null
    this.root.removeFromParent()
  }

  private async ensureAlternate(): Promise<void> {
    if (this.alternate || !this.alternateModelSrc) return
    if (this.alternateLoad) return this.alternateLoad

    this.alternateLoad = (async () => {
      const model = await this.loadModel(
        this.alternateModelSrc,
        { targetWidth: this.alternateTargetWidth },
        'ImportedAlternateBackdrop',
        this.alternateTargetWidth,
      )
      if (this.disposed) {
        this.disposeObject(model)
        return
      }
      model.visible = false
      this.alternate = model
      this.alternateHeight = this.measureCardAltitude(model, this.alternateTargetWidth)
      this.alternateWrap.add(model)
    })()

    try {
      await this.alternateLoad
    } finally {
      this.alternateLoad = null
    }
  }

  private measureCardAltitude(model: THREE.Object3D, width = this.targetWidth): number {
    const bounds = new THREE.Box3().setFromObject(model)
    return bounds.max.y + width * 0.075
  }

  private resetWraps(): void {
    this.primaryWrap.position.set(0, 0, 0)
    this.primaryWrap.scale.set(1, 1, 1)
    this.alternateWrap.position.set(0, 0, 0)
    this.alternateWrap.scale.set(1, 1, 1)
  }

  /** Small crest above stadium, with a clear vertical margin. */
  private layoutStacked(): void {
    const stadiumWidth = this.targetWidth * 0.58
    const crestWidth = this.targetWidth * 0.26
    const gap = 0.62
    const stadiumTopMargin = this.targetWidth * 0.1
    this.resetWraps()
    this.fitWrapToWidth(this.primaryWrap, crestWidth)
    this.fitWrapToWidth(this.alternateWrap, stadiumWidth)

    const crestH = this.wrapSizeY(this.primaryWrap)
    const stadiumH = this.wrapSizeY(this.alternateWrap)
    const total = crestH + gap + stadiumTopMargin + stadiumH
    const stadiumCenterY = stadiumH / 2 - total / 2
    const crestCenterY = stadiumH + gap + stadiumTopMargin + crestH / 2 - total / 2
    this.centerWrapAt(this.alternateWrap, stadiumCenterY)
    this.centerWrapAt(this.primaryWrap, crestCenterY)
    // Keep the logo in front of the bowl so they never sit on the same plane.
    this.primaryWrap.position.z += 0.16
  }

  private fitWrapToWidth(wrap: THREE.Group, width: number): void {
    wrap.updateMatrixWorld(true)
    this._box.setFromObject(wrap)
    this._box.getSize(this._size)
    const current = Math.max(this._size.x, this._size.z, 0.001)
    wrap.scale.setScalar(width / current)
  }

  private wrapSizeY(wrap: THREE.Group): number {
    wrap.updateMatrixWorld(true)
    this._box.setFromObject(wrap)
    this._box.getSize(this._size)
    return this._size.y
  }

  private centerWrapAt(wrap: THREE.Group, localY: number): void {
    this.stadiumRoot.updateMatrixWorld(true)
    wrap.updateMatrixWorld(true)
    this._box.setFromObject(wrap)
    this._box.getCenter(this._center)
    this.stadiumRoot.worldToLocal(this._center)
    wrap.position.x -= this._center.x
    wrap.position.y += localY - this._center.y
    wrap.position.z -= this._center.z
  }

  private async loadModel(
    url: string | null,
    options: StadiumEnvironmentOptions,
    name: string,
    fitWidth = options.targetWidth,
  ): Promise<THREE.Object3D> {
    if (!url) return this.buildProcedural(options)

    try {
      const model = await assetLoader.loadGLB(url, options.onProgress, {
        maxTextureWidth:
          this.maxTextureWidth ??
          options.maxTextureWidth ??
          (fitWidth > 3 ? 1024 : 2048),
      })
      prepareStadiumModel(model, fitWidth)
      model.name = name
      return model
    } catch (error) {
      console.warn(
        `[StadiumEnvironment] GLB load failed (${url}), using procedural stadium`,
        error,
      )
      return this.buildProcedural(options)
    }
  }

  private buildProcedural(options: StadiumEnvironmentOptions): THREE.Object3D {
    const fallback = buildProceduralStadium()
    fallback.scale.setScalar(options.targetWidth / 1.05)
    fallback.name = 'ProceduralStadiumFallback'
    options.onProgress?.({
      loaded: 1,
      total: 1,
      url: 'procedural-stadium',
      ratio: 1,
    })
    return fallback
  }

  private disposeObject(root: THREE.Object3D | null): void {
    if (!root) return
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const cached = Boolean(obj.userData.fromAssetCache)
      if (!cached) obj.geometry?.dispose()
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of materials) {
        if (!mat) continue
        if (!cached) {
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
        }
        mat.dispose()
      }
    })
    root.removeFromParent()
  }

  private addAtmosphere(targetWidth = 1.05): void {
    this.lights.group.position.set(0, 0, 0)
    // Spot lights were authored for ~1-unit crest stadium; scale for free view.
    this.lights.group.scale.setScalar(Math.max(1, targetWidth / 1.05))
    this.root.add(this.lights.group)
    this.lights.setIntensity(0)

    // Soft fill lights — studio IBL carries most of the PBR look from source maps.
    const lightScale = Math.max(1, targetWidth)
    const ambient = new THREE.AmbientLight(0xffead2, 0.42)
    const key = new THREE.DirectionalLight(0xfff4dc, 1.05)
    const fill = new THREE.DirectionalLight(0xb8cffd, 0.45)
    const redWash = new THREE.PointLight(0xe30613, 0.55, 14 * lightScale, 2)
    const hemisphere = new THREE.HemisphereLight(0x6a7a9a, 0x1a0808, 0.32)

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
