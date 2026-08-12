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
 * Trophy GLBs are ~20–40MB each. Mobile keeps a tiny resident set,
 * but still loads the stadium GLB on mid/high phones (downscaled textures).
 */
export function getTrophyLoadBudget(
  capability: DeviceCapability = detectDeviceCapability(),
): TrophyLoadBudget {
  if (capability.isMobile) {
    if (capability.tier === 'low') {
      return {
        maxResidentModels: 2,
        maxPreload: 2,
        // Same stadium GLB as PC — keep backdrop position/look identical.
        preferProceduralStadium: false,
        maxTextureWidth: 512,
        stadiumTextureWidth: 512,
      }
    }
    if (capability.tier === 'mid') {
      return {
        maxResidentModels: 4,
        maxPreload: 3,
        preferProceduralStadium: false,
        maxTextureWidth: 768,
        stadiumTextureWidth: 512,
      }
    }
    return {
      maxResidentModels: 6,
      maxPreload: 4,
      preferProceduralStadium: false,
      maxTextureWidth: 1024,
      stadiumTextureWidth: 768,
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
