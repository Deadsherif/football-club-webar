import * as THREE from 'three'
import { trophies } from '@/data/trophies'
import { TrophyObject } from '@/ar/trophies/TrophyObject'
import { buildTrophyFormation } from '@/ar/trophies/trophyFormation'
import { StadiumEnvironment } from '@/ar/stadium/StadiumEnvironment'
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

  constructor() {
    this.root.name = 'TrophiesWorld'
  }

  async setup(): Promise<void> {
    const capability = detectDeviceCapability()
    const budget = getTrophyLoadBudget(capability)

    await this.environment.setup({
      targetWidth: 7.4,
      preferProcedural: budget.preferProceduralStadium,
    })
    this.environment.contentRoot.name = 'FloatingTrophies'

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

  async ensureTrophyModel(id: string): Promise<void> {
    if (this.disposed) return
    const obj = this.getTrophyById(id)
    if (!obj) return
    this.touchResident(id)
    this.evictIfNeeded(id)
    await obj.ensureModel()
    if (this.disposed) {
      obj.unloadModel()
      return
    }
    this.touchResident(id)
    this.evictIfNeeded(id)
  }

  setIntroProgress(t: number): void {
    this.environment.setLightIntensity(Math.min(1, t * 1.2))
    const reveal = Math.floor(t * this.trophies.length)
    while (this.revealCount < reveal && this.revealCount < this.trophies.length) {
      const obj = this.trophies[this.revealCount]
      obj.group.visible = true
      this.revealCount++
    }
    if (t >= 1) {
      this.introDone = true
      for (const obj of this.trophies) obj.group.visible = true
      this.revealCount = this.trophies.length
    }
  }

  get isIntroDone(): boolean {
    return this.introDone
  }

  get floatingTrophyAltitude(): number {
    return this.environment.floatingCardAltitude
  }

  update(time: number, delta: number): void {
    this.environment.update(time, delta)

    for (let i = 0; i < this.revealCount; i++) {
      const obj = this.trophies[i]
      const targetScale =
        typeof obj.group.userData.targetScale === 'number'
          ? obj.group.userData.targetScale
          : 1
      obj.group.scale.setScalar(
        THREE.MathUtils.damp(obj.group.scale.x, targetScale, 4, delta),
      )
      obj.update(time, delta)
    }
  }

  getTrophyById(id: string): TrophyObject | undefined {
    return this.trophies.find((t) => t.trophy.id === id)
  }

  setFocus(selectedId: string | null, hoveredId: string | null): void {
    for (const obj of this.trophies) {
      const isSel = obj.trophy.id === selectedId
      const isHov = obj.trophy.id === hoveredId
      obj.setSelected(isSel)
      obj.setHovered(isHov && !isSel)
      obj.setDimmed(Boolean(selectedId) && !isSel)
    }
    if (selectedId) void this.ensureTrophyModel(selectedId)
  }

  dispose(): void {
    this.disposed = true
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
    while (this.residentOrder.length > this.maxResident) {
      const victim = this.residentOrder.find((id) => id !== keepId)
      if (!victim) break
      this.residentOrder = this.residentOrder.filter((id) => id !== victim)
      this.getTrophyById(victim)?.unloadModel()
    }

    // Also count currently loaded models that may not be tracked yet.
    const loaded = this.trophies.filter((t) => t.hasModel)
    if (loaded.length <= this.maxResident) return
    for (const obj of loaded) {
      if (obj.trophy.id === keepId) continue
      if (this.residentOrder.includes(obj.trophy.id)) continue
      obj.unloadModel()
    }
  }
}
