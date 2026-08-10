import * as THREE from 'three'
import type { CardAnimState } from '@/ar/presidents/PresidentCard'
import type { LegendPlayer } from '@/data/players'
import { ArCardZoom } from '@/ar/engine/ArCardZoom'
import { yawFacingCamera } from '@/ar/engine/cardFaceCamera'

const CARD_W = 0.42
const CARD_H = 0.62
const CARD_D = 0.012

/**
 * Player equivalent of PresidentCard: same frame, glow, float, focus, dim,
 * and flip behavior, with player-specific canvas faces.
 */
export class PlayerCard3D {
  readonly group = new THREE.Group()
  readonly meshFront: THREE.Mesh
  readonly meshBack: THREE.Mesh
  readonly player: LegendPlayer
  readonly anim: CardAnimState
  /** Visual size multiplier — keep <1 for crest AR pitch cards. */
  baseScale = 1
  entry = 0

  private readonly glow: THREE.Mesh
  private flip = 0
  private targetFlip = 0
  private hover = 0
  private targetHover = 0
  private selected = 0
  private targetSelected = 0
  private brightness = 1
  private dim = 0
  private targetDim = 0
  private disposed = false
  private frontTexture: THREE.CanvasTexture | null = null
  private backTexture: THREE.CanvasTexture | null = null
  private readonly arZoom = new ArCardZoom()
  private focusCamera: THREE.Camera | null = null
  private targetEntry = 1
  private readonly homeLocal = new THREE.Vector3()
  private readonly lockedHome = new THREE.Vector3()
  private homeLocked = false
  private readonly edge: THREE.LineSegments
  private readonly edgeBaseOpacity = 0.9

  constructor(player: LegendPlayer, anim: CardAnimState) {
    this.player = player
    this.anim = anim
    this.group.name = `PlayerCard_${player.id}`
    this.group.userData.playerId = player.id

    const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H)
    this.meshFront = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 1,
        depthWrite: true,
      }),
    )
    this.meshFront.position.z = CARD_D / 2 + 0.002
    this.meshFront.userData.playerId = player.id

    this.meshBack = new THREE.Mesh(
      geometry.clone(),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 1,
        depthWrite: true,
      }),
    )
    this.meshBack.rotation.y = Math.PI
    this.meshBack.position.z = -CARD_D / 2 - 0.002
    this.meshBack.userData.playerId = player.id

    this.edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(CARD_W, CARD_H, CARD_D)),
      new THREE.LineBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: this.edgeBaseOpacity,
      }),
    )
    this.edge.userData.playerId = player.id

    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(CARD_W * 1.18, CARD_H * 1.18),
      new THREE.MeshBasicMaterial({
        color: 0xe30613,
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

  setHovered(value: boolean): void {
    this.targetHover = value ? 1 : 0
  }

  setSelected(value: boolean): void {
    const wasSelected = this.targetSelected > 0.5
    this.targetSelected = value ? 1 : 0
    // Portrait on first select / deselect; keep flip while staying selected.
    if (value && !wasSelected) this.targetFlip = 0
    if (!value) {
      this.targetFlip = 0
      this.homeLocked = false
    }
  }

  setDimmed(value: boolean): void {
    this.targetDim = value ? 1 : 0
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

  toggleFlip(): void {
    this.targetFlip = this.targetFlip > 0.5 ? 0 : 1
  }

  update(time: number, delta: number): void {
    if (this.disposed) return
    this.hover = THREE.MathUtils.damp(this.hover, this.targetHover, 8, delta)
    this.selected = THREE.MathUtils.damp(
      this.selected,
      this.targetSelected,
      5,
      delta,
    )
    this.flip = THREE.MathUtils.damp(this.flip, this.targetFlip, 8, delta)
    this.entry = THREE.MathUtils.damp(this.entry, this.targetEntry, 2.6, delta)
    this.dim = THREE.MathUtils.damp(this.dim, this.targetDim, 7, delta)

    const focusing = this.targetSelected > 0.5 || this.arZoom.isFocusing
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
      : Math.sin(time * this.anim.speed * 0.7 + this.anim.phase) * 0.008
    const scale =
      this.baseScale *
      this.entry *
      (1 + this.hover * 0.08 + this.selected * 0.1 + breathe)
    const entryY = (1 - this.entry) * -0.55 * Math.max(this.baseScale, 0.2)
    const toward =
      (this.hover * 0.18 + this.selected * 0.12) * this.baseScale * motion

    if (focusing) {
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
      this.group.rotation.set(
        this.anim.baseRotation.x + this.hover * -0.06,
        this.anim.baseRotation.y +
          Math.sin(time * 0.4 + this.anim.phase) * 0.05 +
          this.flip * Math.PI +
          this.hover * 0.08,
        this.anim.baseRotation.z,
      )
    }

    this.group.scale.setScalar(Math.max(0.001, scale))
    this.arZoom.apply(
      this.group,
      this.focusCamera,
      delta,
      this.baseScale * this.entry * (1 + (focusing ? 0.04 : this.selected * 0.06)),
      this.homeLocal,
      this.flip,
    )

    this.brightness = 1 - this.dim * 0.72
    const faceOpacity = 1 - this.dim * 0.78
    const frontMat = this.meshFront.material as THREE.MeshBasicMaterial
    const backMat = this.meshBack.material as THREE.MeshBasicMaterial
    const edgeMat = this.edge.material as THREE.LineBasicMaterial
    frontMat.color.setScalar(this.brightness)
    backMat.color.setScalar(this.brightness)
    frontMat.opacity = faceOpacity
    backMat.opacity = faceOpacity
    frontMat.depthWrite = faceOpacity > 0.85
    backMat.depthWrite = faceOpacity > 0.85
    edgeMat.opacity = this.edgeBaseOpacity * faceOpacity
    ;(this.glow.material as THREE.MeshBasicMaterial).opacity =
      (0.025 +
        this.hover * 0.04 +
        this.selected * 0.08 +
        this.arZoom.value * 0.1) *
      (1 - this.dim * 0.92)
  }

  dispose(): void {
    this.disposed = true
    this.frontTexture?.dispose()
    this.backTexture?.dispose()
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]
        materials.forEach((material) => material.dispose())
      }
    })
    this.group.removeFromParent()
  }

  private async loadTextures(): Promise<void> {
    const [front, back] = await Promise.all([
      createPlayerFace(this.player, 'front'),
      createPlayerFace(this.player, 'back'),
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

async function createPlayerFace(
  player: LegendPlayer,
  side: 'front' | 'back',
): Promise<THREE.CanvasTexture> {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas

  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, '#1a0508')
  gradient.addColorStop(0.5, '#0c0506')
  gradient.addColorStop(1, '#140608')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 14
  ctx.strokeRect(18, 18, w - 36, h - 36)
  ctx.strokeStyle = 'rgba(212,175,55,0.35)'
  ctx.lineWidth = 3
  ctx.strokeRect(32, 32, w - 64, h - 64)
  ctx.textAlign = 'center'

  if (side === 'front') {
    await drawPortraitOrPlaceholder(ctx, player.portrait, 28, 28, w - 56, h - 192)
    ctx.fillStyle = 'rgba(10,5,6,0.78)'
    ctx.fillRect(28, h - 182, w - 56, 154)

    ctx.fillStyle = '#d4af37'
    ctx.font = '700 18px Oswald, Arial, sans-serif'
    ctx.fillText('AL AHLY LEGEND', w / 2, h - 148)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 28px Oswald, Arial, sans-serif'
    wrapText(ctx, player.name.toUpperCase(), w / 2, h - 110, w - 78, 30)
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '600 20px Oswald, Arial, sans-serif'
    ctx.fillText(player.position ?? 'LEGEND', w / 2, h - 58)
    ctx.font = '500 17px Oswald, Arial, sans-serif'
    ctx.fillText(player.era, w / 2, h - 32)
  } else {
    ctx.fillStyle = '#d4af37'
    ctx.font = '700 20px Oswald, Arial, sans-serif'
    ctx.fillText('AL AHLY LEGEND', w / 2, 88)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 30px Oswald, Arial, sans-serif'
    wrapText(ctx, player.name.toUpperCase(), w / 2, 136, w - 80, 32)
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = '500 20px Oswald, Arial, sans-serif'
    ctx.fillText(player.position ?? 'FEATURED LEGEND', w / 2, 218)
    ctx.fillText(player.era, w / 2, 248)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '400 18px Manrope, Arial, sans-serif'
    wrapText(ctx, player.description, w / 2, 306, w - 88, 26)
    if (player.achievements?.length) {
      ctx.fillStyle = '#d4af37'
      ctx.font = '700 17px Oswald, Arial, sans-serif'
      ctx.fillText('KEY ACHIEVEMENTS', w / 2, 540)
      ctx.fillStyle = 'rgba(255,255,255,0.78)'
      ctx.font = '400 17px Manrope, Arial, sans-serif'
      player.achievements.slice(0, 2).forEach((achievement, index) => {
        wrapText(ctx, `• ${achievement}`, w / 2, 574 + index * 54, w - 90, 22)
      })
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

async function drawPortraitOrPlaceholder(
  ctx: CanvasRenderingContext2D,
  source: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
): Promise<void> {
  if (!source) {
    ctx.fillStyle = '#24090d'
    ctx.fillRect(x, y, width, height)
    ctx.strokeStyle = 'rgba(212,175,55,0.5)'
    ctx.lineWidth = 4
    ctx.strokeRect(x, y, width, height)
    ctx.fillStyle = '#d4af37'
    ctx.font = '700 18px Oswald, Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PORTRAIT PENDING', x + width / 2, y + height / 2)
    return
  }

  await new Promise<void>((resolve) => {
    const image = new Image()
    // Only remote URLs need CORS; local /assets portraits must load without it.
    if (/^https?:\/\//i.test(source)) {
      image.crossOrigin = 'anonymous'
    }
    image.onload = () => {
      ctx.drawImage(image, x, y, width, height)
      resolve()
    }
    image.onerror = () => resolve()
    image.src = source
  })
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  let line = ''
  let lineY = y
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, lineY)
      line = word
      lineY += lineHeight
    } else {
      line = candidate
    }
  }
  if (line) ctx.fillText(line, x, lineY)
}
