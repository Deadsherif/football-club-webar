import { trophies } from '@/data/trophies'
import {
  detectDeviceCapability,
  type DeviceCapability,
} from '@/utils/deviceCapability'

export interface TrophyLoadBudget {
  /** Max fully-loaded GLBs kept in memory at once. */
  maxResidentModels: number
  /** How many models to preload after setup (before user selects). */
  maxPreload: number
  /** Skip the heavy stadium GLB and use the procedural bowl (low-end only). */
  preferProceduralStadium: boolean
  /** Cap embedded trophy GLB texture decode width. */
  maxTextureWidth: number
  /** Cap stadium backdrop textures on mobile. */
  stadiumTextureWidth: number
}

/**
 * Trophy GLBs are ~20–40MB and stadium.glb is ~73MB.
 * Mobile uses a light stadium + tiny textures + one cup at a time.
 */
export function getTrophyLoadBudget(
  capability: DeviceCapability = detectDeviceCapability(),
): TrophyLoadBudget {
  if (capability.isMobile) {
    return {
      maxResidentModels: 1,
      maxPreload: 0,
      preferProceduralStadium: true,
      maxTextureWidth: capability.tier === 'high' ? 384 : 256,
      stadiumTextureWidth: 256,
    }
  }

  if (capability.tier === 'low') {
    return {
      maxResidentModels: 6,
      maxPreload: 4,
      preferProceduralStadium: false,
      maxTextureWidth: 1536,
      stadiumTextureWidth: 1024,
    }
  }

  return {
    maxResidentModels: trophies.length,
    maxPreload: trophies.length,
    preferProceduralStadium: false,
    maxTextureWidth: 2048,
    stadiumTextureWidth: 2048,
  }
}
