import * as THREE from 'three'
import { fetchCachedBlob } from '@/ar/assets/httpAssetCache'

/** GPU card face size — enough for focus view without oversized VRAM. */
export const CARD_FACE_WIDTH = 384
export const CARD_FACE_HEIGHT = 576

const cardCanvasCache = new Map<string, HTMLCanvasElement>()
const cardCanvasInflight = new Map<string, Promise<HTMLCanvasElement>>()

/** Reuse a painted card canvas across chapter mounts. */
export async function getCachedCardCanvas(
  key: string,
  paint: () => Promise<HTMLCanvasElement>,
): Promise<HTMLCanvasElement> {
  const hit = cardCanvasCache.get(key)
  if (hit) return Promise.resolve(hit)
  const pending = cardCanvasInflight.get(key)
  if (pending) return pending
  const job = paint().then((canvas) => {
    cardCanvasCache.set(key, canvas)
    return canvas
  })
  cardCanvasInflight.set(key, job)
  return job.finally(() => cardCanvasInflight.delete(key))
}

/**
 * Draw a portrait into a canvas rect at cover-fit, decoding only up to the
 * destination size (avoids full-res JPEGs sitting in GPU memory).
 */
export async function drawCoverPortrait(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: { radius?: number; stroke?: boolean },
): Promise<void> {
  const radius = options?.radius ?? 12
  const stroke = options?.stroke ?? true

  let bitmap: ImageBitmap | null = null
  try {
    const blob = await fetchCachedBlob(src)
    const longEdge = Math.ceil(Math.max(w, h) * 1.15)
    bitmap = await createImageBitmap(blob, {
      resizeWidth: longEdge,
      resizeQuality: 'medium',
    })
  } catch {
    ctx.fillStyle = '#2a0a0c'
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.fill()
    return
  }

  const scale = Math.max(w / bitmap.width, h / bitmap.height)
  const dw = bitmap.width * scale
  const dh = bitmap.height * scale
  const dx = x + (w - dw) / 2
  const dy = y + (h - dh) / 2

  ctx.save()
  roundRectPath(ctx, x, y, w, h, radius)
  ctx.clip()
  ctx.drawImage(bitmap, dx, dy, dw, dh)
  ctx.restore()
  bitmap.close()

  if (stroke) {
    ctx.strokeStyle = 'rgba(212,175,55,0.55)'
    ctx.lineWidth = 3
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.stroke()
  }
}

export function finishCardTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 1
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}
