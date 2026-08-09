import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Object3D } from 'three'
import type { AssetLoadProgress } from '@/types/ar'

export type ProgressCallback = (progress: AssetLoadProgress) => void

/**
 * Central asset loader — keeps GLTF caching and progress reporting
 * out of scene / engine code so future scenes can share it.
 */
export class AssetLoader {
  private readonly loader = new GLTFLoader()
  private readonly cache = new Map<string, GLTF>()

  async loadGLB(
    url: string,
    onProgress?: ProgressCallback,
  ): Promise<Object3D> {
    const cached = this.cache.get(url)
    if (cached) {
      onProgress?.({ loaded: 1, total: 1, url, ratio: 1 })
      return cached.scene.clone(true)
    }

    const gltf = await new Promise<GLTF>((resolve, reject) => {
      this.loader.load(
        url,
        resolve,
        (event) => {
          const total = event.total || 1
          onProgress?.({
            loaded: event.loaded,
            total,
            url,
            ratio: Math.min(1, event.loaded / total),
          })
        },
        reject,
      )
    })

    this.cache.set(url, gltf)
    onProgress?.({ loaded: 1, total: 1, url, ratio: 1 })
    return gltf.scene.clone(true)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const assetLoader = new AssetLoader()
