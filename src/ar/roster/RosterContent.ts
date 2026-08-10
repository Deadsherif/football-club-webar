import * as THREE from 'three'
import { PresidentCard, type CardAnimState } from '@/ar/presidents/PresidentCard'
import type { President } from '@/data/presidents'
import {
  arPitchSlots,
  type ArStadiumContentFit,
} from '@/ar/stadium/arContentFit'

/**
 * Shared floating-card roster for crest AR (presidents, board, red castle).
 * Mounts into StadiumEnvironment.contentRoot and sizes to the pitch footprint.
 */
export class RosterContent {
  readonly root = new THREE.Group()
  readonly cards: PresidentCard[] = []

  private readonly roster: readonly President[]
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
  private readonly maxCards: number

  constructor(
    scale: number,
    roster: readonly President[],
    options: { name?: string; maxCards?: number } = {},
  ) {
    this.layoutScale = scale
    this.roster = roster
    this.maxCards = options.maxCards ?? Math.min(roster.length, 12)
    this.root.name = options.name ?? 'RosterContent'
    this.root.visible = false
  }

  setCamera(camera: THREE.Camera | null): void {
    this.camera = camera
    for (const card of this.cards) card.setFocusCamera(camera)
  }

  applyStadiumFit(fit: ArStadiumContentFit): void {
    this.layoutScale = fit.layoutScale
    this.cardScale = fit.cardScale
    this.floatAmplitude = fit.floatAmplitude
    if (this.built) {
      this.clearCards()
      this.built = false
      if (this.root.visible) this.buildCards()
    }
  }

  activate(): void {
    if (this.disposed) return
    this.root.visible = true
    if (!this.built) this.buildCards()
    this.entering = true
    this.revealCount = 0
    this.revealTimer = 0
    for (const card of this.cards) {
      card.group.visible = false
      card.group.scale.setScalar(0.01)
      card.beginFlyIn()
      card.setArFocus(false, this.camera)
    }
  }

  deactivate(): void {
    this.root.visible = false
    this.selectedId = null
    this.setFocus(null, null)
  }

  update(time: number, delta: number): void {
    if (this.disposed || !this.root.visible) return

    if (this.entering) {
      this.revealTimer += delta
      const next = Math.floor(this.revealTimer / 0.1) + 1
      while (this.revealCount < next && this.revealCount < this.cards.length) {
        const card = this.cards[this.revealCount]
        card.group.visible = true
        card.beginFlyIn()
        this.revealCount += 1
      }
      if (this.revealCount >= this.cards.length) this.entering = false
    }

    for (let i = 0; i < this.revealCount; i++) {
      this.cards[i].update(time, delta)
    }
  }

  pick(pointer: THREE.Vector2, camera: THREE.Camera): string | null {
    this.raycaster.setFromCamera(pointer, camera)
    const meshes = this.cards.flatMap((card) => [card.meshFront, card.meshBack])
    const hit = this.raycaster.intersectObjects(meshes, false)[0]
    return (hit?.object.userData.presidentId as string | undefined) ?? null
  }

  setFocus(selectedId: string | null, hoveredId: string | null): void {
    this.selectedId = selectedId
    for (const card of this.cards) {
      const selected = card.president.id === selectedId
      const hovered = card.president.id === hoveredId
      card.setSelected(selected)
      card.setHovered(hovered && !selected)
      card.setDimmed(Boolean(selectedId) && !selected)
      card.setArFocus(selected, this.camera)
    }
  }

  toggleSelectedCard(): void {
    if (!this.selectedId) return
    this.getCard(this.selectedId)?.toggleFlip()
  }

  get selectedIdValue(): string | null {
    return this.selectedId
  }

  /** @deprecated use selectedIdValue — kept for PresidentsContent callers */
  get selectedPresidentId(): string | null {
    return this.selectedId
  }

  getCard(id: string): PresidentCard | undefined {
    return this.cards.find((card) => card.president.id === id)
  }

  dispose(): void {
    this.disposed = true
    this.clearCards()
    this.root.removeFromParent()
  }

  private buildCards(): void {
    const count = Math.min(this.roster.length, this.maxCards)
    const slots = arPitchSlots(count)

    for (let i = 0; i < count; i++) {
      const president = this.roster[i]
      const slot = slots[i]
      const anim: CardAnimState = {
        basePosition: new THREE.Vector3(
          slot.x * this.layoutScale,
          0.05 + (i % 3) * 0.02,
          slot.z * this.layoutScale,
        ),
        baseRotation: new THREE.Euler(-0.12, slot.ry, 0),
        phase: i * 0.73,
        speed: 0.55 + (i % 5) * 0.08,
        amplitude: this.floatAmplitude,
      }
      const card = new PresidentCard(president, anim)
      card.baseScale = this.cardScale
      card.configureArFocus(0.35, 0.22)
      card.setFocusCamera(this.camera)
      card.group.visible = false
      card.group.scale.setScalar(0.01)
      this.cards.push(card)
      this.root.add(card.group)
    }
    this.built = true
  }

  private clearCards(): void {
    for (const card of this.cards) card.dispose()
    this.cards.length = 0
    this.revealCount = 0
    this.built = false
  }
}
