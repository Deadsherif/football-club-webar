import { assetLoader } from '@/ar/assets/AssetLoader'
import { prefetchUrl } from '@/ar/assets/httpAssetCache'
import { warmPresidentCardFaces } from '@/ar/presidents/PresidentCard'
import {
  CLUB_CREST_SCENE,
  PRESIDENTS_CREST_MODEL_SRC,
} from '@/config/scenes'
import { presidents } from '@/data/presidents'
import { boardMembers } from '@/data/boardMembers'
import { redCastleMembers } from '@/data/redCastleMembers'
import { trophies } from '@/data/trophies'

let started = false

/**
 * Warm GLBs + card canvases in the background so chapter switches
 * reuse memory/Cache Storage instead of hitting the network again.
 */
export function prefetchJourneyAssets(): void {
  if (started || typeof window === 'undefined') return
  started = true
  void runPrefetch()
}

async function runPrefetch(): Promise<void> {
  try {
    await Promise.all([
      assetLoader.prefetch(PRESIDENTS_CREST_MODEL_SRC),
      assetLoader.prefetch(CLUB_CREST_SCENE.modelSrc),
    ])
  } catch (error) {
    console.warn('[prefetch] models', error)
  }

  try {
    await warmPresidentCardFaces(presidents)
    await warmPresidentCardFaces(boardMembers)
    await warmPresidentCardFaces(redCastleMembers)
  } catch (error) {
    console.warn('[prefetch] cards', error)
  }

  for (const trophy of trophies) {
    try {
      await prefetchUrl(trophy.modelSrc)
    } catch (error) {
      console.warn('[prefetch] trophy', trophy.id, error)
    }
  }
}
