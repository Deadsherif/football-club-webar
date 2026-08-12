import * as THREE from 'three'
import type { President } from '@/data/presidents'
import { ArCardZoom } from '@/ar/engine/ArCardZoom'
import { yawFacingCamera } from '@/ar/engine/cardFaceCamera'
import {
  CARD_FACE_HEIGHT,
  CARD_FACE_WIDTH,
  drawCoverPortrait,
  finishCardTexture,
  getCachedCardCanvas,
} from '@/ar/engine/cardPortraitDraw'

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
  /** When set, select focus locks here (journey split stage) instead of formation home. */
  private stageHome: THREE.Vector3 | null = null
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
    if (on && !wasSelected) {
      this.targetFlip = 0
      // Journey can select before fly-in finishes — snap to rest pose for framing.
      this.snapIn()
    }
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

  /** Pin the selected card to a fixed local pose (journey two-column stage). */
  setStageHome(pos: THREE.Vector3 | null): void {
    this.stageHome = pos ? pos.clone() : null
    this.homeLocked = false
  }

  beginFlyIn(): void {
    this.entry = 0
    this.targetEntry = 1
  }

  /** Instantly finish entry so select framing uses the final card pose. */
  snapIn(): void {
    this.entry = 1
    this.targetEntry = 1
    this.homeLocked = false
    this.group.scale.setScalar(Math.max(0.001, this.baseScale))
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
      (this.hover * 0.18 + this.select * 0.16) * this.baseScale * motion
    const scale =
      this.baseScale *
      this.entry *
      (1 + this.hover * 0.08 + this.select * 0.16 + breathe)

    const entryY = (1 - this.entry) * 0.95 * Math.max(this.baseScale, 0.2)

    if (focusing) {
      // Freeze home once so damping select / camera motion cannot jitter the card.
      if (!this.homeLocked) {
        if (this.stageHome) {
          this.lockedHome.copy(this.stageHome)
        } else {
          // Always lock the final rest pose (ignore mid-entry offset).
          this.lockedHome.set(
            this.anim.basePosition.x,
            this.anim.basePosition.y + 0.12 * this.baseScale,
            this.anim.basePosition.z,
          )
        }
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
      this.baseScale * this.entry * (1 + (focusing ? 0.1 : this.select * 0.08)),
      this.homeLocal,
      this.flip,
    )

    // Same as trophies: fade others fully out so they cannot cover the selected card.
    const frontMat = this.meshFront.material as THREE.MeshBasicMaterial
    const backMat = this.meshBack.material as THREE.MeshBasicMaterial
    const glowMat = this.glow.material as THREE.MeshBasicMaterial
    const edgeMat = this.edge.material as THREE.LineBasicMaterial

    this.brightness = 1 - this.dim * 0.88
    const faceOpacity = Math.max(0, 1 - this.dim)
    const writeDepth = this.dim < 0.04
    const selected = this.targetSelect > 0.5 || this.select > 0.2
    const hideForFocus = this.targetDim > 0.5 && this.dim > 0.88

    this.group.renderOrder = selected ? 20 : this.dim > 0.2 ? -5 : 0
    this.meshFront.renderOrder = this.group.renderOrder
    this.meshBack.renderOrder = this.group.renderOrder
    this.edge.renderOrder = this.group.renderOrder
    this.glow.renderOrder = this.group.renderOrder

    this.meshFront.visible = !hideForFocus
    this.meshBack.visible = !hideForFocus
    this.edge.visible = !hideForFocus
    this.glow.visible = !hideForFocus

    frontMat.color.setScalar(this.brightness)
    backMat.color.setScalar(this.brightness)
    frontMat.opacity = faceOpacity
    backMat.opacity = faceOpacity
    frontMat.depthWrite = writeDepth && faceOpacity > 0.92
    backMat.depthWrite = writeDepth && faceOpacity > 0.92
    edgeMat.opacity = this.edgeBaseOpacity * faceOpacity

    const isCurrent = this.president.endYear === null
    glowMat.opacity =
      ((isCurrent ? 0.055 : 0.025) +
        this.hover * 0.04 +
        this.select * 0.08 +
        this.arZoom.value * 0.1) *
      (1 - this.dim)
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
  const canvas = await getCachedCardCanvas(
    `card:${president.id}:${side}`,
    () => paintPresidentFace(president, side),
  )
  return finishCardTexture(canvas)
}

export async function warmPresidentCardFaces(
  people: readonly President[],
): Promise<void> {
  for (const person of people) {
    await createCardFaceTexture(person, 'front')
    await createCardFaceTexture(person, 'back')
  }
}

async function paintPresidentFace(
  president: President,
  side: 'front' | 'back',
): Promise<HTMLCanvasElement> {
  const w = CARD_FACE_WIDTH
  const h = CARD_FACE_HEIGHT
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
  ctx.lineWidth = 10
  ctx.strokeRect(14, 14, w - 28, h - 28)
  ctx.strokeStyle = 'rgba(212,175,55,0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(24, 24, w - 48, h - 48)

  if (side === 'front') {
    await drawCoverPortrait(ctx, president.portrait, 22, 22, w - 44, h - 120, {
      radius: 12,
    })

    ctx.fillStyle = 'rgba(10,5,6,0.72)'
    ctx.fillRect(22, h - 112, w - 44, 92)

    ctx.fillStyle = '#d4af37'
    ctx.font = '600 14px Oswald, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      (president.cardEyebrow ?? 'PRESIDENT OF AL AHLY').toUpperCase(),
      w / 2,
      h - 86,
    )

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 22px Oswald, Arial, sans-serif'
    wrapText(ctx, president.name.toUpperCase(), w / 2, h - 58, w - 60, 24)

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '500 16px Oswald, Arial, sans-serif'
    ctx.fillText(president.yearsLabel, w / 2, h - 28)

    if (president.endYear === null) {
      ctx.fillStyle = '#e30613'
      ctx.font = '700 12px Oswald, Arial, sans-serif'
      ctx.fillText(
        (president.currentBadge ?? 'CURRENT PRESIDENT').toUpperCase(),
        w / 2,
        h - 10,
      )
    }
  } else {
    ctx.fillStyle = '#d4af37'
    ctx.font = '600 15px Oswald, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      (president.cardEyebrow ?? 'PRESIDENT OF AL AHLY').toUpperCase(),
      w / 2,
      68,
    )

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 24px Oswald, Arial, sans-serif'
    wrapText(ctx, president.name.toUpperCase(), w / 2, 105, w - 60, 26)

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '500 18px Oswald, Arial, sans-serif'
    ctx.fillText(president.yearsLabel, w / 2, 165)

    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '400 15px Manrope, Arial, sans-serif'
    wrapText(ctx, president.description, w / 2, 220, w - 68, 22)

    if (president.achievements?.length) {
      ctx.fillStyle = '#d4af37'
      ctx.font = '600 14px Oswald, Arial, sans-serif'
      ctx.fillText('KEY MOMENTS', w / 2, 390)
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '400 14px Manrope, Arial, sans-serif'
      let y = 420
      for (const a of president.achievements.slice(0, 3)) {
        wrapText(ctx, `• ${a}`, w / 2, y, w - 76, 18)
        y += 36
      }
    }
  }

  return canvas
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
