import * as THREE from 'three'
import { presidents } from '@/data/presidents'
import { PresidentCard } from '@/ar/presidents/PresidentCard'
import { buildCardFormation } from '@/ar/presidents/cardFormation'
import { StadiumEnvironment } from '@/ar/stadium/StadiumEnvironment'
import {
  CARD_CABINET_SCALE,
  STADIUM_FREE_VIEW_WIDTH,
  STADIUM_SCENE_LIFT,
} from '@/ar/stadium/stadiumExploreFraming'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { getStadiumViewportFit } from '@/utils/stadiumViewport'
import {
  CLUB_CREST_SCENE,
  PRESIDENTS_CREST_MODEL_SRC,
  PRESIDENTS_STADIUM_BACKDROP_IDS,
} from '@/config/scenes'
import {
  applyStadiumIntroFlight,
  getJourneySplitLayout,
  resetStadiumIntroFlight,
} from '@/ar/stadium/stadiumIntroFlight'

/** Compact crest under the cards — fits with the cabinet in one viewport. */
const CREST_TARGET_WIDTH = 1.85

const STADIUM_IDS = new Set<string>(PRESIDENTS_STADIUM_BACKDROP_IDS)

function usesCrestStadiumStack(presidentId: string | null): boolean {
  return Boolean(presidentId && STADIUM_IDS.has(presidentId))
}

/**
 * Al Ahly crest + floating president cards.
 * Uses the same cabinet ring / camera altitude as Trophies.
 * Stadium + crest stacked only for Saleh Selim, Hassan Hamdy, Mahmoud El Khatib.
 */
export class PresidentsWorld {
  readonly environment = new StadiumEnvironment()
  readonly root = this.environment.root
  readonly cards: PresidentCard[] = []
  private introDone = false
  private revealCount = 0
  /** Matches trophies stadium content height for identical explore framing. */
  private cabinetAltitude = 0
  private journeySplit = false
  private journeySpin = 0
  private journeyAutoSpin = true
  private readonly journeyModelTarget = new THREE.Vector3()
  private readonly journeyModelCenter = new THREE.Vector3()
  private readonly _box = new THREE.Box3()
  private readonly _centerWorld = new THREE.Vector3()

  constructor() {
    this.root.name = 'PresidentsWorld'
  }

  async setup(): Promise<void> {
    await this.environment.setup({
      targetWidth: CREST_TARGET_WIDTH,
      modelSrc: PRESIDENTS_CREST_MODEL_SRC,
      alternateModelSrc: CLUB_CREST_SCENE.modelSrc,
      alternateTargetWidth: STADIUM_FREE_VIEW_WIDTH,
    })
    this.environment.contentRoot.name = 'FloatingPresidentCards'
    this.environment.root.position.y = STADIUM_SCENE_LIFT

    const capability = detectDeviceCapability()
    // Skip 73MB stadium prefetch on mobile — it tab-kills /trophies next.
    if (!capability.isMobile) {
      this.cabinetAltitude = await this.environment.prefetchAlternateAltitude()
    }
    if (this.cabinetAltitude <= 0) {
      this.cabinetAltitude = Math.max(
        2.4,
        this.environment.floatingCardAltitude,
      )
    }
    this.applyCrestCardAltitude()
    this.environment.setLightIntensity(0.45)

    const formation = buildCardFormation(presidents)
    const { cardScale } = getStadiumViewportFit()
    const maxCards =
      capability.tier === 'low' ? Math.min(10, formation.length) : formation.length

    for (let i = 0; i < maxCards; i++) {
      const { president, anim } = formation[i]
      const card = new PresidentCard(president, anim)
      card.baseScale = cardScale * CARD_CABINET_SCALE
      card.configureArFocus(0.18, 0.14)
      card.group.visible = false
      card.group.scale.setScalar(0.01)
      this.cards.push(card)
      this.environment.contentRoot.add(card.group)
    }
  }

  /** 0–1: crest/stadium flies in, then cards fly over it. */
  setIntroProgress(t: number): void {
    this.environment.setLightIntensity(Math.min(1, Math.max(0.45, t * 1.2)))
    if (!this.journeySplit) {
      applyStadiumIntroFlight(this.environment.stadiumRoot, t)
    }
    // Cards start after the model is mostly in frame.
    const cardT = Math.max(0, (t - 0.28) / 0.72)
    const reveal = Math.floor(cardT * this.cards.length)
    while (this.revealCount < reveal && this.revealCount < this.cards.length) {
      const card = this.cards[this.revealCount]
      card.group.visible = true
      card.beginFlyIn()
      this.revealCount++
    }
    if (t >= 1) {
      this.introDone = true
      if (!this.journeySplit) resetStadiumIntroFlight(this.environment.stadiumRoot)
      for (const card of this.cards) {
        card.group.visible = true
        card.snapIn()
      }
      this.revealCount = this.cards.length
    }
  }

  get isIntroDone(): boolean {
    return this.introDone
  }

  get floatingCardAltitude(): number {
    return this.environment.root.position.y + this.environment.contentRoot.position.y
  }

  update(time: number, delta: number): void {
    this.environment.update(time, delta)

    if (this.journeySplit && this.journeyAutoSpin) {
      this.journeySpin += delta * 0.5
      this.placeJourneyModel()
    }

    for (let i = 0; i < this.revealCount; i++) {
      this.cards[i].update(time, delta)
    }
  }

  /** True if the pointer ray hits the crest/stadium backdrop. */
  hitTestModel(raycaster: THREE.Raycaster): boolean {
    return raycaster.intersectObject(this.environment.stadiumRoot, true).length > 0
  }

  getCardById(id: string): PresidentCard | undefined {
    return this.cards.find((c) => c.president.id === id)
  }

  getCardByIndex(index: number): PresidentCard | undefined {
    return this.cards[index]
  }

  setFocus(
    selectedId: string | null,
    hoveredId: string | null,
    camera: THREE.Camera | null = null,
  ): Promise<void> {
    for (const card of this.cards) {
      const isSel = card.president.id === selectedId
      const isHov = card.president.id === hoveredId
      card.setSelected(isSel)
      card.setHovered(isHov && !isSel)
      card.setDimmed(Boolean(selectedId) && !isSel)
      card.setArFocus(isSel, camera)
    }
    return this.syncBackdrop(selectedId)
  }

  /**
   * Journey-only: left column = small crest/stadium, right column = selected card.
   * Free explore keeps the normal cabinet ring + full backdrop.
   */
  applyJourneySplit(selectedId: string | null, portrait: boolean): void {
    if (!selectedId) {
      this.clearJourneySplit()
      return
    }

    // Keep cards at the shared cabinet altitude even when stadium swaps in.
    this.environment.setContentAltitude(this.cabinetAltitude)

    const stacked = usesCrestStadiumStack(selectedId)
    const stadiumRoot = this.environment.stadiumRoot
    const layout = getJourneySplitLayout(portrait, !stacked, stacked)
    const stage = new THREE.Vector3(layout.itemX, layout.itemY, layout.itemZ)

    // Small model on the left — same height/depth as the card (parallel columns).
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
      this.cabinetAltitude + layout.itemY,
      layout.itemZ,
    )
    this.journeySplit = true
    this.placeJourneyModel()

    for (const card of this.cards) {
      if (card.president.id === selectedId) {
        card.setStageHome(stage)
        card.configureArFocus(0.06, 0.03)
      } else {
        card.setStageHome(null)
        card.configureArFocus(0.18, 0.14)
      }
    }
  }

  /** Drag yaw for the journey crest/stadium (pauses idle spin). */
  addJourneySpin(deltaYaw: number): void {
    if (!this.journeySplit) return
    this.journeyAutoSpin = false
    this.journeySpin += deltaYaw
    this.placeJourneyModel()
  }

  clearJourneySplit(): void {
    this.journeySplit = false
    this.journeySpin = 0
    this.journeyAutoSpin = true
    resetStadiumIntroFlight(this.environment.stadiumRoot)
    for (const card of this.cards) {
      card.setStageHome(null)
      card.configureArFocus(0.18, 0.14)
    }
    if (this.environment.backdrop === 'primary') this.applyCrestCardAltitude()
  }

  /** Keep the model spinning around its visual center at the card midline. */
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
    this.clearJourneySplit()
    for (const card of this.cards) card.dispose()
    this.environment.dispose()
  }

  private applyCrestCardAltitude(): void {
    // Same floating height as trophies stadium cabinet.
    this.environment.setContentAltitude(this.cabinetAltitude)
  }

  private async syncBackdrop(selectedId: string | null): Promise<void> {
    const kind = usesCrestStadiumStack(selectedId) ? 'stacked' : 'primary'
    await this.environment.setBackdrop(kind)
    if (kind === 'primary') this.applyCrestCardAltitude()
  }
}
