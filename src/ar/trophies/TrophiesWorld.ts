import * as THREE from 'three'
import { trophies } from '@/data/trophies'
import { TrophyObject } from '@/ar/trophies/TrophyObject'
import { buildTrophyFormation } from '@/ar/trophies/trophyFormation'
import {
  buildProceduralStadium,
  prepareStadiumModel,
} from '@/ar/effects/StadiumBuilder'
import { StadiumLights } from '@/ar/effects/StadiumLights'
import { assetLoader } from '@/ar/assets/AssetLoader'
import { CLUB_CREST_SCENE } from '@/config/scenes'
import { detectDeviceCapability } from '@/utils/deviceCapability'

/**
 * Stadium + floating trophy GLBs for the cabinet experience.
 */
export class TrophiesWorld {
  readonly root = new THREE.Group()
  readonly trophies: TrophyObject[] = []
  readonly lights = new StadiumLights()
  private readonly trophyRoot = new THREE.Group()
  private particles: THREE.Points | null = null
  private introDone = false
  private revealCount = 0
  private trophiesBaseHeight = 0

  constructor() {
    this.root.name = 'TrophiesWorld'
  }

  async setup(): Promise<void> {
    const stadium = await this.loadStadium()
    this.root.add(stadium)

    this.trophyRoot.name = 'FloatingTrophies'
    this.trophyRoot.position.y = this.trophiesBaseHeight
    this.root.add(this.trophyRoot)

    this.lights.group.position.set(0, 0, 0)
    this.root.add(this.lights.group)
    this.lights.setIntensity(0)

    const ambient = new THREE.AmbientLight(0xffead2, 1.35)
    ambient.name = 'TrophiesAmbient'
    this.root.add(ambient)

    const key = new THREE.DirectionalLight(0xfff4dc, 2.6)
    key.name = 'TrophiesKeyLight'
    key.position.set(3.5, 7, 4.5)
    this.root.add(key)

    const fill = new THREE.DirectionalLight(0xb8cffd, 1.15)
    fill.name = 'TrophiesFillLight'
    fill.position.set(-4, 4, -3)
    this.root.add(fill)

    const redWash = new THREE.PointLight(0xe30613, 1.4, 14, 2)
    redWash.position.set(0, 3.2, 0)
    this.root.add(redWash)

    const hemi = new THREE.HemisphereLight(0x6a7a9a, 0x1a0808, 0.35)
    this.root.add(hemi)

    this.particles = this.createDust()
    this.root.add(this.particles)

    const formation = buildTrophyFormation(trophies)
    const capability = detectDeviceCapability()
    const maxTrophies =
      capability.tier === 'low' ? Math.min(10, formation.length) : formation.length

    for (let i = 0; i < maxTrophies; i++) {
      const { trophy, anim } = formation[i]
      const obj = new TrophyObject(trophy, anim)
      obj.group.visible = false
      obj.group.scale.setScalar(0.01)
      this.trophies.push(obj)
      this.trophyRoot.add(obj.group)
    }
  }

  setIntroProgress(t: number): void {
    this.lights.setIntensity(Math.min(1, t * 1.2))
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
    return this.trophiesBaseHeight
  }

  update(time: number, delta: number): void {
    this.lights.update(delta)

    for (let i = 0; i < this.revealCount; i++) {
      const obj = this.trophies[i]
      const targetScale = 1
      obj.group.scale.setScalar(
        THREE.MathUtils.damp(obj.group.scale.x, targetScale, 4, delta),
      )
      obj.update(time, delta)
    }

    if (this.particles) {
      this.particles.rotation.y += delta * 0.02
      const positions = this.particles.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute
      for (let i = 0; i < positions.count; i++) {
        positions.setY(i, positions.getY(i) + Math.sin(time + i) * 0.0004)
      }
      positions.needsUpdate = true
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
  }

  dispose(): void {
    for (const obj of this.trophies) obj.dispose()
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

  private async loadStadium(): Promise<THREE.Object3D> {
    try {
      const stadium = await assetLoader.loadGLB(CLUB_CREST_SCENE.modelSrc)
      prepareStadiumModel(stadium, 7.4)
      const bounds = new THREE.Box3().setFromObject(stadium)
      this.trophiesBaseHeight = bounds.max.y + 0.55
      stadium.name = 'ImportedStadium'
      return stadium
    } catch {
      const fallback = buildProceduralStadium()
      fallback.scale.setScalar(1.35)
      fallback.name = 'ProceduralStadiumFallback'
      this.trophiesBaseHeight = 0.45
      return fallback
    }
  }
}
