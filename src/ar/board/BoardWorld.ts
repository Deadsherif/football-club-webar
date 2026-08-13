import { boardMembers } from '@/data/boardMembers'
import { PresidentCard } from '@/ar/presidents/PresidentCard'
import { buildCardFormation } from '@/ar/presidents/cardFormation'
import { StadiumEnvironment } from '@/ar/stadium/StadiumEnvironment'
import {
  CARD_CABINET_SCALE,
  STADIUM_FREE_VIEW_WIDTH,
  STADIUM_SCENE_LIFT,
} from '@/ar/stadium/stadiumExploreFraming'
import {
  applyStadiumIntroFlight,
  resetStadiumIntroFlight,
} from '@/ar/stadium/stadiumIntroFlight'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { getStadiumViewportFit } from '@/utils/stadiumViewport'

/**
 * Stadium + floating board-member cards — same model/style as Presidents.
 */
export class BoardWorld {
  readonly environment = new StadiumEnvironment()
  readonly root = this.environment.root
  readonly cards: PresidentCard[] = []
  private introDone = false
  private revealCount = 0

  constructor() {
    this.root.name = 'BoardWorld'
  }

  async setup(): Promise<void> {
    const capability = detectDeviceCapability()
    await this.environment.setup({
      targetWidth: STADIUM_FREE_VIEW_WIDTH,
      preferProcedural: capability.isMobile,
      maxTextureWidth: capability.isMobile ? 256 : undefined,
    })
    this.environment.contentRoot.name = 'FloatingBoardCards'
    this.environment.root.position.y = STADIUM_SCENE_LIFT

    const formation = buildCardFormation(boardMembers)
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

  setIntroProgress(t: number): void {
    this.environment.setLightIntensity(Math.min(1, t * 1.2))
    applyStadiumIntroFlight(this.environment.stadiumRoot, t)
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
      resetStadiumIntroFlight(this.environment.stadiumRoot)
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
    return this.environment.root.position.y + this.environment.floatingCardAltitude
  }

  update(time: number, delta: number): void {
    this.environment.update(time, delta)
    for (let i = 0; i < this.revealCount; i++) {
      this.cards[i].update(time, delta)
    }
  }

  getCardById(id: string): PresidentCard | undefined {
    return this.cards.find((c) => c.president.id === id)
  }

  setFocus(
    selectedId: string | null,
    hoveredId: string | null,
    camera: import('three').Camera | null = null,
  ): void {
    for (const card of this.cards) {
      const isSel = card.president.id === selectedId
      const isHov = card.president.id === hoveredId
      card.setSelected(isSel)
      card.setHovered(isHov && !isSel)
      card.setDimmed(Boolean(selectedId) && !isSel)
      card.setArFocus(isSel, camera)
    }
  }

  dispose(): void {
    for (const card of this.cards) card.dispose()
    this.environment.dispose()
  }
}
