import * as THREE from 'three'
import { PlayerCard3D } from '@/ar/legends/PlayerCard3D'
import { formationToPositions } from '@/ar/legends/formationToPositions'
import { getLegendPlayer, type LegendPlayer } from '@/data/players'
import type { HistoricalSquad } from '@/data/squads'
import type { ArStadiumContentFit } from '@/ar/stadium/arContentFit'

export type LegendsTransitionPhase = 'idle' | 'dissolve' | 'title' | 'enter'

export interface LegendsContentHooks {
  onTransitionPhase?: (phase: LegendsTransitionPhase) => void
}

/**
 * Mode-specific content mounted into StadiumEnvironment.contentRoot.
 * It never owns the stadium, renderer, camera, or AR session.
 */
export class LegendsContent {
  readonly root = new THREE.Group()
  readonly cards: PlayerCard3D[] = []

  private readonly raycaster = new THREE.Raycaster()
  private hooks: LegendsContentHooks = {}
  private squad: HistoricalSquad | null = null
  private pendingSquad: HistoricalSquad | null = null
  private phase: LegendsTransitionPhase = 'idle'
  private phaseTime = 0
  private revealCount = 0
  private selectedId: string | null = null
  private disposed = false
  private layoutScale: number
  private cardScale = 1
  private floatAmplitude: number | null = null
  private camera: THREE.Camera | null = null

  constructor(scale: number) {
    this.layoutScale = scale
    this.root.name = 'LegendsContent'
  }

  setCamera(camera: THREE.Camera | null): void {
    this.camera = camera
    for (const card of this.cards) card.setFocusCamera(camera)
  }

  setHooks(hooks: LegendsContentHooks): void {
    this.hooks = hooks
  }

  /** Fit FIFA layout + card size to the crest stadium pitch. */
  applyStadiumFit(fit: ArStadiumContentFit): void {
    this.layoutScale = fit.layoutScale
    this.cardScale = fit.cardScale
    this.floatAmplitude = fit.floatAmplitude
    if (this.squad) {
      this.pendingSquad = this.squad
      this.clearCards()
      this.activatePendingSquad()
    }
  }

  setSquad(squad: HistoricalSquad): void {
    this.pendingSquad = squad
    this.selectedId = null
    if (this.cards.length === 0) {
      this.activatePendingSquad()
      return
    }
    this.setPhase('dissolve')
  }

  update(time: number, delta: number): void {
    if (this.disposed) return
    this.phaseTime += delta

    if (this.phase === 'dissolve') {
      for (const card of this.cards) {
        card.group.scale.multiplyScalar(Math.exp(-delta * 8))
      }
      if (this.phaseTime > 0.55) {
        this.clearCards()
        this.setPhase('title')
      }
      return
    }

    if (this.phase === 'title') {
      if (this.phaseTime > 0.65) this.activatePendingSquad()
      return
    }

    if (this.phase === 'enter') {
      const next = Math.floor(this.phaseTime / 0.12) + 1
      while (this.revealCount < next && this.revealCount < this.cards.length) {
        const card = this.cards[this.revealCount]
        card.group.visible = true
        card.beginFlyIn()
        this.revealCount += 1
      }
      if (this.revealCount === this.cards.length) this.setPhase('idle')
    }

    for (let index = 0; index < this.revealCount; index++) {
      this.cards[index].update(time, delta)
    }
  }

  pick(pointer: THREE.Vector2, camera: THREE.Camera): string | null {
    this.raycaster.setFromCamera(pointer, camera)
    const meshes = this.cards.flatMap((card) => [card.meshFront, card.meshBack])
    const hit = this.raycaster.intersectObjects(meshes, false)[0]
    return (hit?.object.userData.playerId as string | undefined) ?? null
  }

  setFocus(selectedId: string | null, hoveredId: string | null): void {
    this.selectedId = selectedId
    for (const card of this.cards) {
      const selected = card.player.id === selectedId
      card.setSelected(selected)
      card.setHovered(card.player.id === hoveredId && !selected)
      card.setDimmed(Boolean(selectedId) && !selected)
      card.setArFocus(selected, this.camera)
    }
  }

  toggleSelectedCard(): void {
    if (this.selectedId) this.getCard(this.selectedId)?.toggleFlip()
  }

  getCard(id: string): PlayerCard3D | undefined {
    return this.cards.find((card) => card.player.id === id)
  }

  getPlayer(id: string): LegendPlayer | undefined {
    return this.getCard(id)?.player
  }

  get activeSquad(): HistoricalSquad | null {
    return this.squad
  }

  get selectedPlayerId(): string | null {
    return this.selectedId
  }

  dispose(): void {
    this.disposed = true
    this.clearCards()
    this.root.removeFromParent()
  }

  private activatePendingSquad(): void {
    const squad = this.pendingSquad
    if (!squad) return
    this.pendingSquad = null
    this.squad = squad
    this.revealCount = 0

    const players = squad.playerIds
      .map(getLegendPlayer)
      .filter((player): player is LegendPlayer => Boolean(player))
    const animations = formationToPositions(
      squad.layout,
      players.length,
      this.layoutScale,
    )

    players.forEach((player, index) => {
      const anim = animations[index]
      if (this.floatAmplitude != null) {
        anim.amplitude = this.floatAmplitude
      }
      anim.basePosition.y += 0.04 + (index % 3) * 0.015
      const card = new PlayerCard3D(player, anim)
      card.baseScale = this.cardScale
      card.configureArFocus(0.35, 0.22)
      card.setFocusCamera(this.camera)
      card.beginFlyIn()
      card.group.visible = false
      card.group.scale.setScalar(0.001)
      this.cards.push(card)
      this.root.add(card.group)
    })
    this.setPhase('enter')
  }

  private clearCards(): void {
    for (const card of this.cards) card.dispose()
    this.cards.length = 0
    this.revealCount = 0
  }

  private setPhase(phase: LegendsTransitionPhase): void {
    this.phase = phase
    this.phaseTime = 0
    this.hooks.onTransitionPhase?.(phase)
  }
}
