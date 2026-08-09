import type { SceneDefinition } from '@/types/ar'

/**
 * Al Ahly crest MindAR target configuration.
 *
 * Replace files:
 * - public/targets/al-ahly.mind  (compiled tracker)
 * - public/assets/crest.png      (UI / printable crest)
 * - public/models/stadium.glb    (stadium model)
 *
 * Recompile target: npm run compile:target
 * (script reads public/targets/club-crest.png by default —
 *  copy crest to that path or update the script.)
 */
export const CLUB_CREST_SCENE: SceneDefinition = {
  id: 'al-ahly-crest',
  nameAr: 'شعار الأهلي',
  nameEn: 'Al Ahly Crest',
  imageTargetSrc: '/targets/al-ahly.mind',
  targetPreviewSrc: '/assets/crest.png',
  modelSrc: '/models/stadium.glb',
}

export const SCENES: Record<string, SceneDefinition> = {
  [CLUB_CREST_SCENE.id]: CLUB_CREST_SCENE,
}

export const DEFAULT_SCENE_ID = CLUB_CREST_SCENE.id
