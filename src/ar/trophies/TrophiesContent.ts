import * as THREE from 'three'
import { TrophyObject, type TrophyAnimState } from '@/ar/trophies/TrophyObject'
import { trophies } from '@/data/trophies'
import {
  arPitchSlots,
  type ArStadiumContentFit,
} from '@/ar/stadium/arContentFit'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { getTrophyLoadBudget } from '@/ar/trophies/trophyBudget'

/**
 * Trophy cabinet for crest AR — placeholders first, GLBs on demand.
 */
export class TrophiesContent {
  readonly root = new THREE.Group()
  readonly trophies: TrophyObject[] = []

  private readonly raycaster = new THREE.Raycaster()
  private layoutScale: number
  private cardScale = 1
  private floatAmplitude = 0.01
  private selectedId: string | null = null
  private revealCount = 0
  private revealTimer = 0
  private entering = false
  private disposed = false
  private built = false
  private camera: THREE.Camera | null = null
  private readonly maxTrophies: number
  private maxResident: number
  private preloadTarget: number
  private maxTextureWidth: number
  private residentOrder: string[] = []

  constructor(scale: number, maxTrophies?: number) {
    const budget = getTrophyLoadBudget(detectDeviceCapability())
    this.layoutScale = scale
    this.maxTrophies = maxTrophies ?? trophies.length
    this.maxResident = budget.maxResidentModels
    this.preloadTarget = budget.maxPreload
    this.maxTextureWidth = budget.maxTextureWidth
    this.root.name = 'TrophiesContent'
    this.root.visible = false
  }

  setCamera(camera: THREE.Camera | null): void {
    this.camera = camera
    for (const trophy of this.trophies) trophy.setFocusCamera(camera)
  }

  applyStadiumFit(fit: ArStadiumContentFit): void {
    this.layoutScale = fit.layoutScale
    // Trophies read a bit larger than flat cards at the same footprint.
    this.cardScale = fit.cardScale * 0.85
    this.floatAmplitude = fit.floatAmplitude
    if (this.built) {
      this.clearTrophies()
      this.built = false
      if (this.root.visible) this.buildTrophies()
    }
  }

  activate(): void {
    if (this.disposed) return
    this.root.visible = true
    if (!this.built) this.buildTrophies()
    this.entering = true
    this.revealCount = 0
    this.revealTimer = 0
    for (const trophy of this.trophies) {
      trophy.group.visible = false
      trophy.group.scale.setScalar(0.01)
    }
    void this.preloadInitial()
  }

  deactivate(): void {
    this.root.visible = false
    this.selectedId = null
    this.setFocus(null, null)
    // Free GLB heap while leaving the cabinet (stadium stays for other modes).
    for (const trophy of this.trophies) trophy.unloadModel()
    this.residentOrder = []
  }

  update(time: number, delta: number): void {
    if (this.disposed || !this.root.visible) return

    if (this.entering) {
      this.revealTimer += delta
      const next = Math.floor(this.revealTimer / 0.12) + 1
      while (
        this.revealCount < next &&
        this.revealCount < this.trophies.length
      ) {
        this.trophies[this.revealCount].group.visible = true
        this.revealCount += 1
      }
      if (this.revealCount >= this.trophies.length) this.entering = false
    }

    for (let i = 0; i < this.revealCount; i++) {
      this.trophies[i].update(time, delta)
    }
  }

  pick(pointer: THREE.Vector2, camera: THREE.Camera): string | null {
    this.raycaster.setFromCamera(pointer, camera)
    const meshes = this.trophies.flatMap((trophy) => {
      const list: THREE.Object3D[] = [trophy.hitProxy]
      trophy.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj !== trophy.hitProxy) list.push(obj)
      })
      return list
    })
    const hit = this.raycaster.intersectObjects(meshes, false)[0]
    return (hit?.object.userData.trophyId as string | undefined) ?? null
  }

  setFocus(selectedId: string | null, hoveredId: string | null): void {
    this.selectedId = selectedId
    for (const trophy of this.trophies) {
      const selected = trophy.trophy.id === selectedId
      const hovered = trophy.trophy.id === hoveredId
      trophy.setSelected(selected)
      trophy.setHovered(hovered && !selected)
      trophy.setDimmed(Boolean(selectedId) && !selected)
      trophy.setFocusCamera(this.camera)
    }
    if (selectedId) void this.ensureTrophyModel(selectedId)
  }

  get selectedTrophyId(): string | null {
    return this.selectedId
  }

  getTrophy(id: string): TrophyObject | undefined {
    return this.trophies.find((trophy) => trophy.trophy.id === id)
  }

  dispose(): void {
    this.disposed = true
    this.clearTrophies()
    this.root.removeFromParent()
  }

  private buildTrophies(): void {
    const count = Math.min(trophies.length, this.maxTrophies)
    const slots = arPitchSlots(count)

    for (let i = 0; i < count; i++) {
      const trophy = trophies[i]
      const slot = slots[i]
      const anim: TrophyAnimState = {
        basePosition: new THREE.Vector3(
          slot.x * this.layoutScale,
          0.08 + (i % 3) * 0.02,
          slot.z * this.layoutScale,
        ),
        baseRotation: new THREE.Euler(0, slot.ry, 0),
        phase: i * 0.73,
        speed: 0.55 + (i % 5) * 0.08,
        amplitude: this.floatAmplitude,
      }
      const obj = new TrophyObject(trophy, anim)
      obj.setLoadOptions({ maxTextureWidth: this.maxTextureWidth })
      obj.group.userData.targetScale = this.cardScale
      obj.configureArFocus(0.28, 0.18)
      obj.setFocusCamera(this.camera)
      obj.group.visible = false
      obj.group.scale.setScalar(0.01)
      this.trophies.push(obj)
      this.root.add(obj.group)
    }
    this.built = true
  }

  private async preloadInitial(): Promise<void> {
    for (let i = 0; i < this.preloadTarget; i++) {
      if (this.disposed || !this.root.visible) return
      const id = this.trophies[i]?.trophy.id
      if (!id) return
      try {
        await this.ensureTrophyModel(id)
      } catch (error) {
        console.warn('[TrophiesContent] Preload failed', id, error)
      }
    }
  }

  private async ensureTrophyModel(id: string): Promise<void> {
    if (this.disposed) return
    const obj = this.getTrophy(id)
    if (!obj) return
    this.touchResident(id)
    this.evictIfNeeded(id)
    try {
      await obj.ensureModel()
    } catch (error) {
      console.warn('[TrophiesContent] Trophy load failed', id, error)
      return
    }
    if (this.disposed || !this.root.visible) {
      obj.unloadModel()
      return
    }
    // Stale — user selected another trophy while this one was loading.
    if (this.selectedId && this.selectedId !== id) {
      this.evictIfNeeded(this.selectedId)
      return
    }
    this.touchResident(id)
    this.evictIfNeeded(id)
    obj.revealForFocus()
  }

  private touchResident(id: string): void {
    this.residentOrder = this.residentOrder.filter((item) => item !== id)
    this.residentOrder.push(id)
  }

  private evictIfNeeded(keepId: string): void {
    const protectedId = this.selectedId ?? keepId
    while (this.residentOrder.length > this.maxResident) {
      const victim = this.residentOrder.find(
        (id) => id !== keepId && id !== protectedId,
      )
      if (!victim) break
      this.residentOrder = this.residentOrder.filter((id) => id !== victim)
      this.getTrophy(victim)?.unloadModel()
    }
  }

  private clearTrophies(): void {
    for (const trophy of this.trophies) trophy.dispose()
    this.trophies.length = 0
    this.revealCount = 0
    this.residentOrder = []
    this.built = false
  }
}
