import * as THREE from 'three'
import type { President } from '@/data/presidents'
import { ArCardZoom } from '@/ar/engine/ArCardZoom'
import { yawFacingCamera } from '@/ar/engine/cardFaceCamera'

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
 * Floating president card. Portraits use unlit materials so stadium lights
 * cannot wash out or blur their source images.
 */
export class PresidentCard {
  readonly group = new THREE.Group()
  readonly meshFront: THREE.Mesh
  readonly meshBack: THREE.Mesh
  readonly glow: THREE.Mesh
  readonly president: President
  readonly anim: CardAnimState
  /** Visual size multiplier — keep <1 for crest AR pitch cards. */
  baseScale = 1
  /** Entry 0→1 for fly-in from below the pitch. */
  entry = 0

  private flip = 0
  private targetFlip = 0
  private hover = 0
  private targetHover = 0
  private select = 0
  private targetSelect = 0
  private brightness = 1
  private dim = 0
  private targetDim = 0
  private disposed = false
  private frontTexture: THREE.CanvasTexture | null = null
  private backTexture: THREE.CanvasTexture | null = null
  private readonly arZoom = new ArCardZoom()
  private focusCamera: THREE.Camera | null = null
  private targetEntry = 1
  private orbit = 0
  private readonly homeLocal = new THREE.Vector3()
  private readonly lockedHome = new THREE.Vector3()
  private homeLocked = false
  private readonly edge: THREE.LineSegments
  private readonly edgeBaseOpacity: number

  constructor(president: President, anim: CardAnimState) {
    this.president = president
    this.anim = anim
    this.group.name = `PresidentCard_${president.id}`
    this.group.userData.presidentId = president.id

    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H)
    const frontMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1,
      depthWrite: true,
    })
    const backMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
      transparent: true,
      opacity: 1,
      depthWrite: true,
    })

    this.meshFront = new THREE.Mesh(geo, frontMat)
    this.meshFront.position.z = CARD_D / 2 + 0.002
    this.meshFront.userData.presidentId = president.id

    this.meshBack = new THREE.Mesh(geo.clone(), backMat)
    this.meshBack.rotation.y = Math.PI
    this.meshBack.position.z = -CARD_D / 2 - 0.002
    this.meshBack.userData.presidentId = president.id

    // A wire frame keeps depth without putting an opaque box over the portrait.
    this.edgeBaseOpacity = 0.85
    this.edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D)),
      new THREE.LineBasicMaterial({
        color: president.endYear === null ? 0xe30613 : 0xd4af37,
        transparent: true,
        opacity: this.edgeBaseOpacity,
      }),
    )
    this.edge.userData.presidentId = president.id

    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(CARD_W * 1.18, CARD_H * 1.18),
      new THREE.MeshBasicMaterial({
        color: president.endYear === null ? 0xe30613 : 0xd4af37,
        transparent: true,
        opacity: 0.025,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.glow.position.z = -0.02

    this.group.add(this.edge, this.meshFront, this.meshBack, this.glow)
    this.group.position.copy(anim.basePosition)
    this.group.rotation.copy(anim.baseRotation)
    void this.loadTextures()
  }

  setHovered(on: boolean): void {
    this.targetHover = on ? 1 : 0
  }

  setSelected(on: boolean): void {
    const wasSelected = this.targetSelect > 0.5
    this.targetSelect = on ? 1 : 0
    // Portrait on first select / deselect; keep flip while staying selected.
    if (on && !wasSelected) this.targetFlip = 0
    if (!on) {
      this.targetFlip = 0
      this.homeLocked = false
    }
  }

  setFlipped(on: boolean): void {
    this.targetFlip = on ? 1 : 0
  }

  toggleFlip(): void {
    this.targetFlip = this.targetFlip > 0.5 ? 0 : 1
  }

  setDimmed(dim: boolean): void {
    this.targetDim = dim ? 1 : 0
  }

  setArFocus(active: boolean, camera: THREE.Camera | null = null): void {
    this.arZoom.setActive(active)
    if (camera) this.focusCamera = camera
  }

  /** Stronger select zoom for crest AR (camera cannot dolly). */
  configureArFocus(boost: number, pull: number): void {
    this.arZoom.focusScaleBoost = boost
    this.arZoom.focusPull = pull
  }

  setFocusCamera(camera: THREE.Camera | null): void {
    this.focusCamera = camera
  }

  beginFlyIn(): void {
    this.entry = 0
    this.targetEntry = 1
  }

  update(time: number, delta: number): void {
    if (this.disposed) return

    this.hover = THREE.MathUtils.damp(this.hover, this.targetHover, 8, delta)
    this.select = THREE.MathUtils.damp(this.select, this.targetSelect, 5, delta)
    this.flip = THREE.MathUtils.damp(this.flip, this.targetFlip, 8, delta)
    this.entry = THREE.MathUtils.damp(this.entry, this.targetEntry, 2.6, delta)
    this.dim = THREE.MathUtils.damp(this.dim, this.targetDim, 7, delta)
    this.orbit += delta * 0.22

    const focusing = this.targetSelect > 0.5 || this.arZoom.isFocusing
    const motion = focusing ? 0 : 1

    const floatY =
      Math.sin(time * this.anim.speed + this.anim.phase) *
      this.anim.amplitude *
      motion
    const driftX =
      Math.cos(time * 0.35 + this.anim.phase) *
      this.anim.amplitude *
      0.45 *
      motion
    const driftZ =
      Math.sin(time * 0.28 + this.anim.phase * 1.1) *
      this.anim.amplitude *
      0.35 *
      motion
    const breathe = focusing
      ? 0
      : Math.sin(time * (this.anim.speed * 0.7) + this.anim.phase) * 0.008

    const toward =
      (this.hover * 0.18 + this.select * 0.12) * this.baseScale * motion
    const scale =
      this.baseScale *
      this.entry *
      (1 + this.hover * 0.08 + this.select * 0.1 + breathe)

    const entryY = (1 - this.entry) * -0.55 * Math.max(this.baseScale, 0.2)

    if (focusing) {
      // Freeze home once so damping select / camera motion cannot jitter the card.
      if (!this.homeLocked) {
        this.lockedHome.set(
          this.anim.basePosition.x,
          this.anim.basePosition.y + entryY + 0.12 * this.baseScale,
          this.anim.basePosition.z,
        )
        this.homeLocked = true
      }
      this.homeLocal.copy(this.lockedHome)
      this.group.position.copy(this.homeLocal)
      // Face the lens so select always shows the image first, then flip for back.
      const faceYaw = this.focusCamera
        ? yawFacingCamera(this.homeLocal, this.group.parent, this.focusCamera)
        : this.anim.baseRotation.y
      this.group.rotation.set(0, faceYaw + this.flip * Math.PI, 0)
    } else {
      this.homeLocked = false
      this.homeLocal.set(
        this.anim.basePosition.x,
        this.anim.basePosition.y + entryY,
        this.anim.basePosition.z + toward,
      )
      this.group.position.set(
        this.homeLocal.x + driftX,
        this.homeLocal.y + floatY,
        this.homeLocal.z + driftZ,
      )
      this.group.rotation.x = this.anim.baseRotation.x + this.hover * -0.06
      this.group.rotation.y =
        this.anim.baseRotation.y +
        Math.sin(time * 0.4 + this.anim.phase) * 0.05 +
        this.flip * Math.PI +
        this.hover * 0.08
      this.group.rotation.z = this.anim.baseRotation.z
    }

    this.group.scale.setScalar(Math.max(0.001, scale))
    this.arZoom.apply(
      this.group,
      this.focusCamera,
      delta,
      this.baseScale * this.entry * (1 + (focusing ? 0.04 : this.select * 0.06)),
      this.homeLocal,
      this.flip,
    )

    const frontMat = this.meshFront.material as THREE.MeshBasicMaterial
    const backMat = this.meshBack.material as THREE.MeshBasicMaterial
    const glowMat = this.glow.material as THREE.MeshBasicMaterial
    const edgeMat = this.edge.material as THREE.LineBasicMaterial

    this.brightness = 1 - this.dim * 0.72
    const faceOpacity = 1 - this.dim * 0.78
    frontMat.color.setScalar(this.brightness)
    backMat.color.setScalar(this.brightness)
    frontMat.opacity = faceOpacity
    backMat.opacity = faceOpacity
    frontMat.depthWrite = faceOpacity > 0.85
    backMat.depthWrite = faceOpacity > 0.85
    edgeMat.opacity = this.edgeBaseOpacity * faceOpacity

    const isCurrent = this.president.endYear === null
    glowMat.opacity =
      ((isCurrent ? 0.055 : 0.025) +
        this.hover * 0.04 +
        this.select * 0.08 +
        this.arZoom.value * 0.1) *
      (1 - this.dim * 0.92)
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
    ;(this.meshFront.material as THREE.MeshBasicMaterial).map = front
    ;(this.meshFront.material as THREE.MeshBasicMaterial).needsUpdate = true
    ;(this.meshBack.material as THREE.MeshBasicMaterial).map = back
    ;(this.meshBack.material as THREE.MeshBasicMaterial).needsUpdate = true
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
    ctx.fillText(
      (president.cardEyebrow ?? 'PRESIDENT OF AL AHLY').toUpperCase(),
      w / 2,
      h - 115,
    )

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 30px Oswald, Arial, sans-serif'
    wrapText(ctx, president.name.toUpperCase(), w / 2, h - 78, w - 80, 32)

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '500 22px Oswald, Arial, sans-serif'
    ctx.fillText(president.yearsLabel, w / 2, h - 38)

    if (president.endYear === null) {
      ctx.fillStyle = '#e30613'
      ctx.font = '700 16px Oswald, Arial, sans-serif'
      ctx.fillText(
        (president.currentBadge ?? 'CURRENT PRESIDENT').toUpperCase(),
        w / 2,
        h - 12,
      )
    }
  } else {
    ctx.fillStyle = '#d4af37'
    ctx.font = '600 20px Oswald, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      (president.cardEyebrow ?? 'PRESIDENT OF AL AHLY').toUpperCase(),
      w / 2,
      90,
    )

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
