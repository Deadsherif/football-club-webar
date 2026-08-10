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
  /** Skip the heavy stadium GLB and use the procedural bowl. */
  preferProceduralStadium: boolean
  /** Cap embedded GLB texture decode width. */
  maxTextureWidth: number
}

/**
 * Trophy GLBs are ~20–40MB each. Mobile tabs die if we load the cabinet eagerly.
 */
export function getTrophyLoadBudget(
  capability: DeviceCapability = detectDeviceCapability(),
): TrophyLoadBudget {
  if (capability.isMobile) {
    if (capability.tier === 'low') {
      return {
        maxResidentModels: 1,
        maxPreload: 1,
        preferProceduralStadium: true,
        maxTextureWidth: 512,
      }
    }
    if (capability.tier === 'mid') {
      return {
        maxResidentModels: 2,
        maxPreload: 1,
        preferProceduralStadium: true,
        maxTextureWidth: 768,
      }
    }
    return {
      maxResidentModels: 2,
      maxPreload: 2,
      preferProceduralStadium: true,
      maxTextureWidth: 1024,
    }
  }

  if (capability.tier === 'low') {
    return {
      maxResidentModels: 6,
      maxPreload: 4,
      preferProceduralStadium: false,
      maxTextureWidth: 1536,
    }
  }

  return {
    maxResidentModels: trophies.length,
    maxPreload: trophies.length,
    preferProceduralStadium: false,
    maxTextureWidth: 2048,
  }
}
