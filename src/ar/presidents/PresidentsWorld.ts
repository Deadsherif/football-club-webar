import * as THREE from 'three'
import { presidents } from '@/data/presidents'
import { PresidentCard } from '@/ar/presidents/PresidentCard'
import { buildCardFormation } from '@/ar/presidents/cardFormation'
import { buildProceduralStadium } from '@/ar/effects/StadiumBuilder'
import { StadiumLights } from '@/ar/effects/StadiumLights'
import { detectDeviceCapability } from '@/utils/deviceCapability'

/**
 * Stadium + floating president cards. Can mount under MindAR anchor or free WebGL.
 */
export class PresidentsWorld {
  readonly root = new THREE.Group()
  readonly cards: PresidentCard[] = []
  readonly lights = new StadiumLights()
  private particles: THREE.Points | null = null
  private introDone = false
  private revealCount = 0

  constructor() {
    this.root.name = 'PresidentsWorld'
  }

  async setup(): Promise<void> {
    const stadium = buildProceduralStadium()
    stadium.scale.setScalar(1.35)
    stadium.position.y = 0
    this.root.add(stadium)

    this.lights.group.position.set(0, 0, 0)
    this.root.add(this.lights.group)
    this.lights.setIntensity(0)

    const ambient = new THREE.AmbientLight(0xffe8e0, 0.25)
    ambient.name = 'PresidentsAmbient'
    this.root.add(ambient)

    const redWash = new THREE.PointLight(0xe30613, 0.35, 12, 2)
    redWash.position.set(0, 2.2, 0)
    this.root.add(redWash)

    const hemi = new THREE.HemisphereLight(0x6a7a9a, 0x1a0808, 0.35)
    this.root.add(hemi)

    this.particles = this.createDust()
    this.root.add(this.particles)

    const formation = buildCardFormation(presidents)
    const capability = detectDeviceCapability()
    // Low-end: fewer cards initially fully visible — still create all, reveal in intro
    const maxCards =
      capability.tier === 'low' ? Math.min(10, formation.length) : formation.length

    for (let i = 0; i < maxCards; i++) {
      const { president, anim } = formation[i]
      const card = new PresidentCard(president, anim)
      card.group.visible = false
      card.group.scale.setScalar(0.01)
      this.cards.push(card)
      this.root.add(card.group)
    }
  }

  /** 0–1 cinematic lights + sequential card reveals */
  setIntroProgress(t: number): void {
    this.lights.setIntensity(Math.min(1, t * 1.2))
    const reveal = Math.floor(t * this.cards.length)
    while (this.revealCount < reveal && this.revealCount < this.cards.length) {
      const card = this.cards[this.revealCount]
      card.group.visible = true
      this.revealCount++
    }
    if (t >= 1) {
      this.introDone = true
      for (const card of this.cards) card.group.visible = true
      this.revealCount = this.cards.length
    }
  }

  get isIntroDone(): boolean {
    return this.introDone
  }

  update(time: number, delta: number): void {
    this.lights.update(delta)

    for (let i = 0; i < this.revealCount; i++) {
      const card = this.cards[i]
      // Scale in when revealed
      const targetScale = 1
      card.group.scale.setScalar(
        THREE.MathUtils.damp(card.group.scale.x, targetScale, 4, delta),
      )
      card.update(time, delta)
    }

    if (this.particles) {
      this.particles.rotation.y += delta * 0.02
      const positions = this.particles.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++) {
        positions.setY(
          i,
          positions.getY(i) + Math.sin(time + i) * 0.0004,
        )
      }
      positions.needsUpdate = true
    }
  }

  getCardById(id: string): PresidentCard | undefined {
    return this.cards.find((c) => c.president.id === id)
  }

  getCardByIndex(index: number): PresidentCard | undefined {
    return this.cards[index]
  }

  setFocus(selectedId: string | null, hoveredId: string | null): void {
    for (const card of this.cards) {
      const isSel = card.president.id === selectedId
      const isHov = card.president.id === hoveredId
      card.setSelected(isSel)
      card.setHovered(isHov && !isSel)
      card.setDimmed(Boolean(selectedId) && !isSel)
    }
  }

  dispose(): void {
    for (const card of this.cards) card.dispose()
    this.lights.dispose()
    this.particles?.geometry.dispose()
    ;(this.particles?.material as THREE.Material | undefined)?.dispose()
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
    this.root.removeFromParent()
  }

  private createDust(): THREE.Points {
    const capability = detectDeviceCapability()
    const count = Math.floor(80 * capability.particleScale)
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = Math.random() * 3.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xffd7a8,
      size: 0.03,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geo, mat)
    points.name = 'StadiumDust'
    return points
  }
}
