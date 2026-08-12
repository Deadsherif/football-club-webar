import * as THREE from 'three'
import { trophies } from '@/data/trophies'
import { TrophyObject } from '@/ar/trophies/TrophyObject'
import { buildTrophyFormation } from '@/ar/trophies/trophyFormation'
import { StadiumEnvironment } from '@/ar/stadium/StadiumEnvironment'
import {
  STADIUM_FREE_VIEW_WIDTH,
  STADIUM_SCENE_LIFT,
} from '@/ar/stadium/stadiumExploreFraming'
import {
  applyStadiumIntroFlight,
  getJourneySplitLayout,
  resetStadiumIntroFlight,
} from '@/ar/stadium/stadiumIntroFlight'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { getStadiumViewportFit } from '@/utils/stadiumViewport'
import { getTrophyLoadBudget } from '@/ar/trophies/trophyBudget'

/**
 * Same stadium orientation/lighting as Presidents, with floating trophy GLBs.
 * Models load on demand under a hard resident budget (mobile OOM guard).
 */
export class TrophiesWorld {
  readonly environment = new StadiumEnvironment()
  readonly root = this.environment.root
  readonly trophies: TrophyObject[] = []
  private introDone = false
  private revealCount = 0
  private residentOrder: string[] = []
  private maxResident = trophies.length
  private preloadTarget = 0
  private disposed = false
  /** Currently focused trophy — stale async loads must not evict this. */
  private focusId: string | null = null
  private journeySplit = false
  private journeySpin = 0
  private journeyAutoSpin = true
  private readonly journeyModelTarget = new THREE.Vector3()
  private readonly journeyModelCenter = new THREE.Vector3()
  private readonly _box = new THREE.Box3()
  private readonly _centerWorld = new THREE.Vector3()

  constructor() {
    this.root.name = 'TrophiesWorld'
  }

  async setup(): Promise<void> {
    const capability = detectDeviceCapability()
    const budget = getTrophyLoadBudget(capability)

    await this.environment.setup({
      targetWidth: STADIUM_FREE_VIEW_WIDTH,
      preferProcedural: budget.preferProceduralStadium,
      maxTextureWidth: budget.stadiumTextureWidth,
    })
    this.environment.contentRoot.name = 'FloatingTrophies'
    this.environment.root.position.y = STADIUM_SCENE_LIFT
    // Readable stadium before cinematic light ramp (esp. mobile / procedural).
    this.environment.setLightIntensity(0.65)

    const formation = buildTrophyFormation(trophies)
    const { cardScale } = getStadiumViewportFit()
    this.maxResident = budget.maxResidentModels
    this.preloadTarget = Math.min(budget.maxPreload, formation.length)

    for (let i = 0; i < formation.length; i++) {
      const { trophy, anim } = formation[i]
      const obj = new TrophyObject(trophy, anim)
      obj.setLoadOptions({ maxTextureWidth: budget.maxTextureWidth })
      obj.group.visible = false
      obj.group.scale.setScalar(0.01)
      obj.group.userData.targetScale = cardScale
      this.trophies.push(obj)
      this.environment.contentRoot.add(obj.group)
    }

    // Kick a tiny preload after placeholders are on screen — never all GLBs.
    void this.preloadInitial()
  }

  /**
   * Load (with retry) and keep resident. Ignores stale completions when the
   * user has already navigated to another trophy in the journey.
   */
  async ensureTrophyModel(id: string): Promise<boolean> {
    if (this.disposed) return false
    const obj = this.getTrophyById(id)
    if (!obj) return false

    this.touchResident(id)
    this.evictIfNeeded(id)

    try {
      await obj.ensureModel()
    } catch (error) {
      console.warn('[TrophiesWorld] Trophy load failed', id, error)
      return false
    }

    if (this.disposed) {
      obj.unloadModel()
      return false
    }

    // Stale request — user moved on; don't steal the resident slot.
    if (this.focusId && this.focusId !== id) {
      if (!this.residentOrder.includes(id)) obj.unloadModel()
      else this.evictIfNeeded(this.focusId)
      return obj.hasModel
    }

    this.touchResident(id)
    this.evictIfNeeded(id)
    obj.revealForFocus()
    return obj.hasModel
  }

  /** Prefetch neighbour trophies for smoother journey Next/Prev on mobile. */
  prefetchAround(id: string): void {
    const index = this.trophies.findIndex((t) => t.trophy.id === id)
    if (index < 0) return
    const neighbours = [index - 1, index + 1]
      .map((i) => this.trophies[i]?.trophy.id)
      .filter((nid): nid is string => Boolean(nid))
    for (const nid of neighbours) {
      void this.ensureTrophyModel(nid).catch(() => undefined)
    }
  }

  setIntroProgress(t: number): void {
    this.environment.setLightIntensity(Math.max(0.65, Math.min(1, t * 1.2)))
    if (!this.journeySplit) {
      applyStadiumIntroFlight(this.environment.stadiumRoot, t)
    }
    const trophyT = Math.max(0, (t - 0.28) / 0.72)
    const reveal = Math.floor(trophyT * this.trophies.length)
    while (this.revealCount < reveal && this.revealCount < this.trophies.length) {
      const obj = this.trophies[this.revealCount]
      obj.group.visible = true
      obj.beginFlyIn()
      this.revealCount++
    }
    if (t >= 1) {
      this.introDone = true
      if (!this.journeySplit) resetStadiumIntroFlight(this.environment.stadiumRoot)
      for (const obj of this.trophies) {
        obj.group.visible = true
        obj.snapIn()
        const targetScale =
          typeof obj.group.userData.targetScale === 'number'
            ? obj.group.userData.targetScale
            : 1
        obj.group.scale.setScalar(targetScale)
      }
      this.revealCount = this.trophies.length
    }
  }

  get isIntroDone(): boolean {
    return this.introDone
  }

  get floatingTrophyAltitude(): number {
    return this.environment.root.position.y + this.environment.floatingCardAltitude
  }

  update(time: number, delta: number): void {
    this.environment.update(time, delta)

    if (this.journeySplit && this.journeyAutoSpin) {
      this.journeySpin += delta * 0.35
      this.placeJourneyModel()
    }

    for (let i = 0; i < this.revealCount; i++) {
      this.trophies[i].update(time, delta)
    }
    // Always update the focused trophy even if intro hasn't revealed the ring yet.
    if (this.focusId) {
      const focused = this.getTrophyById(this.focusId)
      if (focused && this.trophies.indexOf(focused) >= this.revealCount) {
        focused.update(time, delta)
      }
    }
  }

  getTrophyById(id: string): TrophyObject | undefined {
    return this.trophies.find((t) => t.trophy.id === id)
  }

  setFocus(selectedId: string | null, hoveredId: string | null): void {
    this.focusId = selectedId
    for (const obj of this.trophies) {
      const isSel = obj.trophy.id === selectedId
      const isHov = obj.trophy.id === hoveredId
      obj.setSelected(isSel)
      obj.setHovered(isHov && !isSel)
      obj.setDimmed(Boolean(selectedId) && !isSel)
      if (isSel) obj.revealForFocus()
    }
  }

  setFocusCamera(camera: THREE.Camera | null): void {
    for (const obj of this.trophies) obj.setFocusCamera(camera)
  }

  /**
   * Journey-only: stadium left + selected trophy right (same layout as presidents).
   */
  applyJourneySplit(selectedId: string | null, portrait: boolean): void {
    if (!selectedId) {
      this.clearJourneySplit()
      return
    }

    const altitude = this.environment.floatingCardAltitude
    const stadiumRoot = this.environment.stadiumRoot
    // Readable left-column stadium (same compact scale as crest journey).
    const layout = getJourneySplitLayout(portrait, true, false)
    const stage = new THREE.Vector3(layout.itemX, layout.itemY, layout.itemZ)

    stadiumRoot.scale.setScalar(layout.modelScale)
    stadiumRoot.position.set(0, 0, 0)
    stadiumRoot.rotation.set(0, 0, 0)
    this.environment.root.updateMatrixWorld(true)
    this._box.setFromObject(stadiumRoot)
    this._box.getCenter(this._centerWorld)
    this.journeyModelCenter.copy(this._centerWorld)
    this.environment.root.worldToLocal(this.journeyModelCenter)

    this.journeyModelTarget.set(
      layout.modelX,
      altitude + layout.itemY,
      layout.itemZ,
    )
    this.journeySplit = true
    this.placeJourneyModel()

    for (const obj of this.trophies) {
      if (obj.trophy.id === selectedId) {
        obj.setStageHome(stage)
        obj.configureArFocus(0.08, 0.04)
        obj.revealForFocus()
      } else {
        obj.setStageHome(null)
        obj.configureArFocus(0.1, 0.05)
      }
    }
  }

  clearJourneySplit(): void {
    this.journeySplit = false
    this.journeySpin = 0
    this.journeyAutoSpin = true
    resetStadiumIntroFlight(this.environment.stadiumRoot)
    for (const obj of this.trophies) {
      obj.setStageHome(null)
      obj.configureArFocus(0.1, 0.05)
    }
  }

  private placeJourneyModel(): void {
    const root = this.environment.stadiumRoot
    const c = this.journeyModelCenter
    const yaw = this.journeySpin
    const cos = Math.cos(yaw)
    const sin = Math.sin(yaw)
    const cx = c.x * cos - c.z * sin
    const cz = c.x * sin + c.z * cos
    root.rotation.set(0, yaw, 0)
    root.position.set(
      this.journeyModelTarget.x - cx,
      this.journeyModelTarget.y - c.y,
      this.journeyModelTarget.z - cz,
    )
  }

  dispose(): void {
    this.disposed = true
    this.focusId = null
    this.clearJourneySplit()
    for (const obj of this.trophies) obj.dispose()
    this.trophies.length = 0
    this.residentOrder = []
    this.environment.dispose()
  }

  private async preloadInitial(): Promise<void> {
    for (let i = 0; i < this.preloadTarget; i++) {
      if (this.disposed) return
      const id = this.trophies[i]?.trophy.id
      if (!id) return
      try {
        await this.ensureTrophyModel(id)
      } catch (error) {
        console.warn('[TrophiesWorld] Preload failed', id, error)
      }
    }
  }

  private touchResident(id: string): void {
    this.residentOrder = this.residentOrder.filter((item) => item !== id)
    this.residentOrder.push(id)
  }

  private evictIfNeeded(keepId: string): void {
    const protectedId = this.focusId ?? keepId
    while (this.residentOrder.length > this.maxResident) {
      const victim = this.residentOrder.find(
        (id) => id !== keepId && id !== protectedId,
      )
      if (!victim) break
      this.residentOrder = this.residentOrder.filter((id) => id !== victim)
      this.getTrophyById(victim)?.unloadModel()
    }

    // Also count currently loaded models that may not be tracked yet.
    const loaded = this.trophies.filter((t) => t.hasModel)
    if (loaded.length <= this.maxResident) return
    for (const obj of loaded) {
      if (obj.trophy.id === keepId || obj.trophy.id === protectedId) continue
      if (this.residentOrder.includes(obj.trophy.id)) continue
      obj.unloadModel()
    }
  }
}
