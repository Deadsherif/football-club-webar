import { redCastleMembers } from '@/data/redCastleMembers'
import { PresidentCard } from '@/ar/presidents/PresidentCard'
import { buildCardFormation } from '@/ar/presidents/cardFormation'
import { StadiumEnvironment } from '@/ar/stadium/StadiumEnvironment'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { getStadiumViewportFit } from '@/utils/stadiumViewport'

/**
 * Stadium + floating El Qalaa El Hamraa board cards — same model as Presidents.
 */
export class RedCastleWorld {
  readonly environment = new StadiumEnvironment()
  readonly root = this.environment.root
  readonly cards: PresidentCard[] = []
  private introDone = false
  private revealCount = 0

  constructor() {
    this.root.name = 'RedCastleWorld'
  }

  async setup(): Promise<void> {
    await this.environment.setup({ targetWidth: 7.4 })
    this.environment.contentRoot.name = 'FloatingRedCastleCards'

    const formation = buildCardFormation(redCastleMembers)
    const capability = detectDeviceCapability()
    const { cardScale } = getStadiumViewportFit()
    const maxCards =
      capability.tier === 'low' ? Math.min(10, formation.length) : formation.length

    for (let i = 0; i < maxCards; i++) {
      const { president, anim } = formation[i]
      const card = new PresidentCard(president, anim)
      card.baseScale = cardScale
      card.group.visible = false
      card.group.scale.setScalar(0.01)
      this.cards.push(card)
      this.environment.contentRoot.add(card.group)
    }
  }

  setIntroProgress(t: number): void {
    this.environment.setLightIntensity(Math.min(1, t * 1.2))
    const reveal = Math.floor(t * this.cards.length)
    while (this.revealCount < reveal && this.revealCount < this.cards.length) {
      const card = this.cards[this.revealCount]
      card.group.visible = true
      card.beginFlyIn()
      this.revealCount++
    }
    if (t >= 1) {
      this.introDone = true
      for (const card of this.cards) {
        card.group.visible = true
        if (card.entry < 0.01) card.beginFlyIn()
      }
      this.revealCount = this.cards.length
    }
  }

  get isIntroDone(): boolean {
    return this.introDone
  }

  get floatingCardAltitude(): number {
    return this.environment.floatingCardAltitude
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

