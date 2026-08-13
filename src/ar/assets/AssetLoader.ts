import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ImageBitmapLoader } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Object3D } from 'three'
import type { AssetLoadProgress } from '@/types/ar'
import { fetchCachedBuffer, prefetchUrl } from '@/ar/assets/httpAssetCache'
import { resolveModelSrc } from '@/ar/assets/resolveModelSrc'

export type ProgressCallback = (progress: AssetLoadProgress) => void

type ImageBitmapLoaderProto = {
  load: (
    url: string,
    onLoad?: (bitmap: ImageBitmap) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) => void
  path?: string
  manager: THREE.LoadingManager
  crossOrigin?: string
  requestHeader?: HeadersInit
  options: ImageBitmapOptions
}

/** One decode at a time — parallel 4K JPEGs OOM and cause blob texture failures. */
let decodeChain: Promise<void> = Promise.resolve()

function enqueueDecode<T>(task: () => Promise<T>): Promise<T> {
  const run = decodeChain.then(task, task)
  decodeChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function decodeViaHtmlImage(
  blob: Blob,
  baseOptions: ImageBitmapOptions,
  maxWidth: number,
): Promise<ImageBitmap> {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = objectUrl
    await img.decode()
    const naturalW = img.naturalWidth || maxWidth
    const width = Math.min(naturalW, maxWidth)
    return await createImageBitmap(img, {
      ...baseOptions,
      resizeWidth: width,
      resizeQuality: 'high',
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Decode embedded GLB images without changing the file on disk.
 * Large JPEGs often fail as plain blob→ImageBitmap; progressive resize /
 * HTMLImage fallbacks keep meshes/materials intact and still show textures.
 */
/** Active while a GLB parse runs — caps embedded texture decode for mobile. */
let activeMaxTextureWidth = 2048

async function decodeBlobToImageBitmap(
  blob: Blob,
  baseOptions: ImageBitmapOptions,
): Promise<ImageBitmap> {
  return enqueueDecode(async () => {
    const cap = activeMaxTextureWidth
    // Only resizeWidth so aspect ratio stays correct (no mesh/UV changes).
    const attempts: ImageBitmapOptions[] = []
    if (cap >= 2048) {
      attempts.push({ ...baseOptions })
    }
    for (const width of [2048, 1536, 1024, 768, 512, 384, 256]) {
      if (width > cap) continue
      attempts.push({
        ...baseOptions,
        resizeWidth: width,
        resizeQuality: 'high',
      })
    }
    if (attempts.length === 0) {
      attempts.push({
        ...baseOptions,
        resizeWidth: Math.max(256, cap),
        resizeQuality: 'high',
      })
    }

    let lastError: unknown
    for (const options of attempts) {
      try {
        return await createImageBitmap(blob, options)
      } catch (error) {
        lastError = error
      }
    }

    for (const maxWidth of [cap, 1024, 512, 256].filter((w, i, arr) => {
      return w > 0 && arr.indexOf(w) === i && w <= Math.max(cap, 1024)
    })) {
      try {
        return await decodeViaHtmlImage(blob, baseOptions, maxWidth)
      } catch (error) {
        lastError = error
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to decode GLB texture')
  })
}

let safeImageBitmapPatchCount = 0
let originalImageBitmapLoad: ImageBitmapLoaderProto['load'] | null = null
let originalCreateObjectURL: typeof URL.createObjectURL | null = null
let originalRevokeObjectURL: typeof URL.revokeObjectURL | null = null

/** blob: URL → Blob. Avoids fetch(blob:) which Edge/Chrome often rejects. */
const blobUrlRegistry = new Map<string, Blob>()

function bitmapOptionsFromLoader(
  options: ImageBitmapOptions,
): ImageBitmapOptions {
  return {
    ...options,
    colorSpaceConversion: 'none',
    imageOrientation: 'none',
    premultiplyAlpha: 'none',
  }
}

function resolveTextureBlob(url: string): Promise<Blob> {
  const known = blobUrlRegistry.get(url)
  if (known) return Promise.resolve(known)

  // http(s) only — never rely on fetch(blob:) on Chromium
  if (url.startsWith('blob:')) {
    return Promise.reject(
      new Error('Embedded texture blob URL missing from registry'),
    )
  }

  return fetch(url, { credentials: 'omit' }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status} for texture`)
    return res.blob()
  })
}

function installSafeImageBitmapPatch(): void {
  if (safeImageBitmapPatchCount > 0) {
    safeImageBitmapPatchCount += 1
    return
  }

  originalCreateObjectURL = URL.createObjectURL.bind(URL)
  originalRevokeObjectURL = URL.revokeObjectURL.bind(URL)

  URL.createObjectURL = ((obj: Blob | MediaSource) => {
    const objectUrl = originalCreateObjectURL!(obj)
    if (typeof Blob !== 'undefined' && obj instanceof Blob) {
      blobUrlRegistry.set(objectUrl, obj)
    }
    return objectUrl
  }) as typeof URL.createObjectURL

  URL.revokeObjectURL = ((objectUrl: string) => {
    blobUrlRegistry.delete(objectUrl)
    originalRevokeObjectURL!(objectUrl)
  }) as typeof URL.revokeObjectURL

  const proto = ImageBitmapLoader.prototype as unknown as ImageBitmapLoaderProto
  originalImageBitmapLoad = proto.load
  proto.load = function patchedLoad(url, onLoad, _onProgress, onError) {
    if (url === undefined) url = ''
    if (this.path !== undefined) url = this.path + url
    url = this.manager.resolveURL(url)

    const scope = this
    const cached = THREE.Cache.get(url)
    if (cached !== undefined) {
      scope.manager.itemStart(url)
      queueMicrotask(() => {
        onLoad?.(cached as ImageBitmap)
        scope.manager.itemEnd(url)
      })
      return
    }

    scope.manager.itemStart(url)

    // Capture Blob synchronously before GLTFLoader can revoke the object URL.
    const capturedBlob = blobUrlRegistry.get(url)

    const blobPromise = capturedBlob
      ? Promise.resolve(capturedBlob)
      : resolveTextureBlob(url)

    blobPromise
      .then((blob) =>
        decodeBlobToImageBitmap(blob, bitmapOptionsFromLoader(scope.options)),
      )
      .then((imageBitmap) => {
        THREE.Cache.add(url, imageBitmap)
        onLoad?.(imageBitmap)
        scope.manager.itemEnd(url)
      })
      .catch((error) => {
        console.warn('[AssetLoader] Texture decode fallback failed', url, error)
        onError?.(error)
        scope.manager.itemError(url)
        scope.manager.itemEnd(url)
      })
  }
  safeImageBitmapPatchCount = 1
}

function uninstallSafeImageBitmapPatch(): void {
  safeImageBitmapPatchCount = Math.max(0, safeImageBitmapPatchCount - 1)
  if (safeImageBitmapPatchCount > 0 || !originalImageBitmapLoad) return

  ;(ImageBitmapLoader.prototype as unknown as ImageBitmapLoaderProto).load =
    originalImageBitmapLoad
  originalImageBitmapLoad = null

  if (originalCreateObjectURL) {
    URL.createObjectURL = originalCreateObjectURL
    originalCreateObjectURL = null
  }
  if (originalRevokeObjectURL) {
    URL.revokeObjectURL = originalRevokeObjectURL
    originalRevokeObjectURL = null
  }
  blobUrlRegistry.clear()
}

export interface LoadGLBOptions {
  onProgress?: ProgressCallback
  /** Keep parsed GLTF in memory (default true). Trophy loads set false. */
  cache?: boolean
  /** Cap embedded texture decode width (mobile OOM guard). */
  maxTextureWidth?: number
}

/**
 * Loads GLBs as authored (mesh/materials unchanged on disk).
 * Texture decode is hardened only at runtime for browser limits.
 */
export class AssetLoader {
  private readonly cache = new Map<string, GLTF>()
  private readonly inflight = new Map<string, Promise<GLTF>>()
  private queue: Promise<void> = Promise.resolve()

  async loadGLB(
    url: string,
    onProgress?: ProgressCallback,
    options?: LoadGLBOptions,
  ): Promise<Object3D> {
    url = resolveModelSrc(url)
    const progress = options?.onProgress ?? onProgress
    const useCache = options?.cache !== false
    const maxTextureWidth = options?.maxTextureWidth ?? 2048
    const gltf = await this.loadGltf(url, progress, {
      cache: useCache,
      maxTextureWidth,
    })
    return this.instantiate(gltf.scene)
  }

  /** Download into Cache Storage + memory so the next parse skips the network. */
  prefetch(url: string): Promise<void> {
    return prefetchUrl(resolveModelSrc(url))
  }

  private loadGltf(
    url: string,
    onProgress?: ProgressCallback,
    options?: { cache?: boolean; maxTextureWidth?: number },
  ): Promise<GLTF> {
    const useCache = options?.cache !== false
    if (useCache) {
      const cached = this.cache.get(url)
      if (cached) {
        onProgress?.({ loaded: 1, total: 1, url, ratio: 1 })
        return Promise.resolve(cached)
      }
    }

    const pending = this.inflight.get(url)
    if (pending) return pending

    const job = this.enqueue(() =>
      this.fetchGltf(url, onProgress, {
        cache: useCache,
        maxTextureWidth: options?.maxTextureWidth ?? 2048,
      }),
    )
    this.inflight.set(url, job)
    return job.finally(() => {
      this.inflight.delete(url)
    })
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task)
    this.queue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  private async fetchGltf(
    url: string,
    onProgress?: ProgressCallback,
    options?: { cache?: boolean; maxTextureWidth?: number },
  ): Promise<GLTF> {
    const prevMax = activeMaxTextureWidth
    activeMaxTextureWidth = options?.maxTextureWidth ?? 2048
    installSafeImageBitmapPatch()
    try {
      const buffer = await fetchCachedBuffer(url, (loaded, total) => {
        onProgress?.({
          loaded,
          total,
          url,
          ratio: Math.min(1, loaded / total),
        })
      })

      const loader = new GLTFLoader()
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.parse(buffer, '', resolve, reject)
      })

      await this.ensureTexturesReady(gltf.scene)
      if (options?.cache !== false) {
        this.cache.set(url, gltf)
      }
      onProgress?.({ loaded: 1, total: 1, url, ratio: 1 })
      return gltf
    } catch (error) {
      console.error('[AssetLoader] Failed to load', url, error)
      throw error
    } finally {
      activeMaxTextureWidth = prevMax
      uninstallSafeImageBitmapPatch()
    }
  }

  /**
   * Scene instance for a new WebGL context: shared geometry/textures,
   * cloned materials so chapters can dispose without killing the cache.
   */
  private instantiate(source: Object3D): Object3D {
    const root = source.clone(true)
    root.traverse((obj) => {
      obj.userData.fromAssetCache = true
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh || !mesh.material) return
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      const cloned = materials.map((mat) => {
        const next = mat.clone()
        const maps = [
          'map',
          'normalMap',
          'roughnessMap',
          'metalnessMap',
          'aoMap',
          'emissiveMap',
        ] as const
        for (const key of maps) {
          const tex = (next as unknown as Record<string, THREE.Texture | undefined>)[key]
          if (tex) tex.needsUpdate = true
        }
        return next
      })
      mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0]
    })
    return root
  }

  private async ensureTexturesReady(root: Object3D): Promise<void> {
    const pending: Promise<void>[] = []
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      for (const mat of materials) {
        if (!mat) continue
        const std = mat as THREE.MeshStandardMaterial
        const maps: Array<{ tex?: THREE.Texture | null; srgb?: boolean }> = [
          { tex: std.map, srgb: true },
          { tex: std.emissiveMap, srgb: true },
          { tex: std.normalMap },
          { tex: std.roughnessMap },
          { tex: std.metalnessMap },
          { tex: std.aoMap },
        ]
        for (const { tex, srgb } of maps) {
          if (!(tex instanceof THREE.Texture)) continue
          if (srgb) tex.colorSpace = THREE.SRGBColorSpace
          tex.needsUpdate = true
          pending.push(this.decodeTexture(tex))
        }
      }
    })
    await Promise.all(pending)
  }

  private async decodeTexture(texture: THREE.Texture): Promise<void> {
    const image = texture.image as
      | HTMLImageElement
      | ImageBitmap
      | HTMLCanvasElement
      | undefined
    if (!image) return

    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
      texture.needsUpdate = true
      return
    }

    if (image instanceof HTMLImageElement) {
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener(
            'error',
            () => reject(new Error('Texture image failed to decode')),
            { once: true },
          )
        })
      }
      if ('decode' in image && typeof image.decode === 'function') {
        try {
          await image.decode()
        } catch {
          // already decoded
        }
      }
      texture.needsUpdate = true
    }
  }

  /** Drop a cached GLTF without disposing GPU (caller may still hold clones). */
  release(url: string): void {
    this.cache.delete(url)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const assetLoader = new AssetLoader()
