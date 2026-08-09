import type { BaseARScene } from '@/ar/scenes/BaseARScene'
import { ClubCrestScene } from '@/ar/scenes/ClubCrestScene'
import type { ProgressCallback } from '@/ar/assets/AssetLoader'
import { DEFAULT_SCENE_ID } from '@/config/scenes'

type SceneFactory = (onProgress?: ProgressCallback) => BaseARScene

/**
 * Registry for AR scenes. Add new factories here as experiences grow
 * (stadium portal, trophies, legends, …) without touching the engine.
 */
const factories = new Map<string, SceneFactory>([
  ['al-ahly-crest', (onProgress) => new ClubCrestScene(onProgress)],
  // Back-compat alias
  ['club-crest', (onProgress) => new ClubCrestScene(onProgress)],
])

export function registerScene(id: string, factory: SceneFactory): void {
  factories.set(id, factory)
}

export function createScene(
  id: string = DEFAULT_SCENE_ID,
  onProgress?: ProgressCallback,
): BaseARScene {
  const factory = factories.get(id)
  if (!factory) {
    throw new Error(`Unknown AR scene: "${id}". Registered: ${[...factories.keys()].join(', ')}`)
  }
  return factory(onProgress)
}

export function listSceneIds(): string[] {
  return [...factories.keys()]
}
