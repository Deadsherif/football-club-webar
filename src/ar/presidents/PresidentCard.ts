import * as THREE from 'three'
import type { President } from '@/data/presidents'

const CARD_W = 0.42
const CARD_H = 0.62
const CARD_D = 0.012

export interface CardAnimState {
  basePosition: THREE.Vector3
  baseRotation: THREE.Euler
  phase: number
  speed: number
  amplitude: number
}

/**
 * Holographic-style football president card (front + back planes).
 */
export class PresidentCard {
  readonly group = new THREE.Group()
  readonly meshFront: THREE.Mesh
  readonly meshBack: THREE.Mesh
  readonly glow: THREE.Mesh
  readonly president: President
  readonly anim: CardAnimState

  private flip = 0
  private targetFlip = 0
  private hover = 0
  private targetHover = 0
  private select = 0
  private targetSelect = 0
  private brightness = 1
  private disposed = false
  private frontTexture: THREE.CanvasTexture | null = null
  private backTexture: THREE.CanvasTexture | null = null

  constructor(president: President, anim: CardAnimState) {
    this.president = president
    this.anim = anim
    this.group.name = `PresidentCard_${president.id}`
    this.group.userData.presidentId = president.id

    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H)
    const frontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.35,
      roughness: 0.35,
      emissive: 0x220508,
      emissiveIntensity: 0.25,
      side: THREE.FrontSide,
    })
    const backMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x1a0800,
      emissiveIntensity: 0.2,
      side: THREE.FrontSide,
    })

    this.meshFront = new THREE.Mesh(geo, frontMat)
    this.meshFront.position.z = CARD_D / 2
    this.meshFront.userData.presidentId = president.id

    this.meshBack = new THREE.Mesh(geo.clone(), backMat)
    this.meshBack.rotation.y = Math.PI
    this.meshBack.position.z = -CARD_D / 2
    this.meshBack.userData.presidentId = president.id

    // Thin edge / depth slab
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(CARD_W * 0.98, CARD_H * 0.98, CARD_D),
      new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.7,
        roughness: 0.25,
        emissive: 0x4a3008,
        emissiveIntensity: 0.15,
      }),
    )
    edge.userData.presidentId = president.id

    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(CARD_W * 1.18, CARD_H * 1.18),
      new THREE.MeshBasicMaterial({
        color: president.endYear === null ? 0xe30613 : 0xd4af37,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.glow.position.z = -0.02

    this.group.add(edge, this.meshFront, this.meshBack, this.glow)
    this.group.position.copy(anim.basePosition)
    this.group.rotation.copy(anim.baseRotation)

    void this.loadTextures()
  }

  setHovered(on: boolean): void {
    this.targetHover = on ? 1 : 0
  }

  setSelected(on: boolean): void {
    this.targetSelect = on ? 1 : 0
    if (on) this.targetFlip = 1
  }

  setFlipped(on: boolean): void {
    this.targetFlip = on ? 1 : 0
  }

  toggleFlip(): void {
    this.targetFlip = this.targetFlip > 0.5 ? 0 : 1
  }

  setDimmed(dim: boolean): void {
    this.brightness = dim ? 0.35 : 1
  }

  update(time: number, delta: number): void {
    if (this.disposed) return

    this.hover = THREE.MathUtils.damp(this.hover, this.targetHover, 8, delta)
    this.select = THREE.MathUtils.damp(this.select, this.targetSelect, 5, delta)
    this.flip = THREE.MathUtils.damp(this.flip, this.targetFlip, 6, delta)

    const floatY =
      Math.sin(time * this.anim.speed + this.anim.phase) * this.anim.amplitude
    const breathe =
      Math.sin(time * (this.anim.speed * 0.7) + this.anim.phase) * 0.008

    const toward = this.hover * 0.18 + this.select * 0.55
    const scale = 1 + this.hover * 0.08 + this.select * 0.22 + breathe

    this.group.position.x = this.anim.basePosition.x
    this.group.position.y = this.anim.basePosition.y + floatY + this.select * 0.12
    this.group.position.z = this.anim.basePosition.z + toward

    this.group.rotation.x = this.anim.baseRotation.x + this.hover * -0.06
    this.group.rotation.y =
      this.anim.baseRotation.y +
      Math.sin(time * 0.4 + this.anim.phase) * 0.04 +
      this.flip * Math.PI +
      this.hover * 0.08
    this.group.rotation.z = this.anim.baseRotation.z

    this.group.scale.setScalar(scale)

    const frontMat = this.meshFront.material as THREE.MeshStandardMaterial
    const backMat = this.meshBack.material as THREE.MeshStandardMaterial
    const glowMat = this.glow.material as THREE.MeshBasicMaterial

    const emit =
      (0.2 + this.hover * 0.45 + this.select * 0.7) * this.brightness
    frontMat.emissiveIntensity = emit
    backMat.emissiveIntensity = emit * 0.85
    frontMat.color.setScalar(this.brightness)
    backMat.color.setScalar(this.brightness)

    const isCurrent = this.president.endYear === null
    glowMat.opacity =
      (isCurrent ? 0.22 : 0.1) + this.hover * 0.2 + this.select * 0.35
  }

  dispose(): void {
    this.disposed = true
    this.frontTexture?.dispose()
    this.backTexture?.dispose()
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
    this.group.removeFromParent()
  }

  private async loadTextures(): Promise<void> {
    const [front, back] = await Promise.all([
      createCardFaceTexture(this.president, 'front'),
      createCardFaceTexture(this.president, 'back'),
    ])
    if (this.disposed) {
      front.dispose()
      back.dispose()
      return
    }
    this.frontTexture = front
    this.backTexture = back
    ;(this.meshFront.material as THREE.MeshStandardMaterial).map = front
    ;(this.meshFront.material as THREE.MeshStandardMaterial).needsUpdate = true
    ;(this.meshBack.material as THREE.MeshStandardMaterial).map = back
    ;(this.meshBack.material as THREE.MeshStandardMaterial).needsUpdate = true
  }
}

async function createCardFaceTexture(
  president: President,
  side: 'front' | 'back',
): Promise<THREE.CanvasTexture> {
  const w = 512
  const h = 768
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Background
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#1a0508')
  grad.addColorStop(0.5, '#0c0506')
  grad.addColorStop(1, '#140608')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Gold frame
  ctx.strokeStyle = president.endYear === null ? '#e30613' : '#d4af37'
  ctx.lineWidth = 14
  ctx.strokeRect(18, 18, w - 36, h - 36)
  ctx.strokeStyle = 'rgba(212,175,55,0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(32, 32, w - 64, h - 64)

  if (side === 'front') {
    // Full-bleed poster crop (already framed in gold/red)
    await drawPortrait(ctx, president.portrait, 28, 28, w - 56, h - 160)

    ctx.fillStyle = 'rgba(10,5,6,0.72)'
    ctx.fillRect(28, h - 150, w - 56, 122)

    ctx.fillStyle = '#d4af37'
    ctx.font = '600 18px Oswald, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PRESIDENT OF AL AHLY', w / 2, h - 115)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 30px Oswald, Arial, sans-serif'
    wrapText(ctx, president.name.toUpperCase(), w / 2, h - 78, w - 80, 32)

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '500 22px Oswald, Arial, sans-serif'
    ctx.fillText(president.yearsLabel, w / 2, h - 38)

    if (president.endYear === null) {
      ctx.fillStyle = '#e30613'
      ctx.font = '700 16px Oswald, Arial, sans-serif'
      ctx.fillText('CURRENT PRESIDENT', w / 2, h - 12)
    }
  } else {
    ctx.fillStyle = '#d4af37'
    ctx.font = '600 20px Oswald, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PRESIDENT OF AL AHLY', w / 2, 90)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 32px Oswald, Arial, sans-serif'
    wrapText(ctx, president.name.toUpperCase(), w / 2, 140, w - 80, 34)

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '500 24px Oswald, Arial, sans-serif'
    ctx.fillText(president.yearsLabel, w / 2, 220)

    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '400 20px Manrope, Arial, sans-serif'
    wrapText(ctx, president.description, w / 2, 290, w - 90, 28)

    if (president.achievements?.length) {
      ctx.fillStyle = '#d4af37'
      ctx.font = '600 18px Oswald, Arial, sans-serif'
      ctx.fillText('KEY MOMENTS', w / 2, 520)
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '400 18px Manrope, Arial, sans-serif'
      let y = 560
      for (const a of president.achievements.slice(0, 3)) {
        wrapText(ctx, `• ${a}`, w / 2, y, w - 100, 24)
        y += 48
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      ctx.save()
      roundRect(ctx, x, y, w, h, 16)
      ctx.clip()
      ctx.drawImage(img, x, y, w, h)
      ctx.restore()
      ctx.strokeStyle = 'rgba(212,175,55,0.55)'
      ctx.lineWidth = 4
      roundRect(ctx, x, y, w, h, 16)
      ctx.stroke()
      resolve()
    }
    img.onerror = () => {
      ctx.fillStyle = '#2a0a0c'
      roundRect(ctx, x, y, w, h, 16)
      ctx.fill()
      resolve()
    }
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy)
      line = word
      yy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
}
