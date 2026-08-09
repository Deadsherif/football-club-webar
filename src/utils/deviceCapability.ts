export type DeviceTier = 'high' | 'mid' | 'low'

export interface DeviceCapability {
  tier: DeviceTier
  isMobile: boolean
  isDesktop: boolean
  maxPixelRatio: number
  particleScale: number
  antialias: boolean
  prefersReducedMotion: boolean
  hasWebGL: boolean
  hasGetUserMedia: boolean
}

export function detectDeviceCapability(): DeviceCapability {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  const isDesktop = !isMobile
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const hasGetUserMedia = Boolean(navigator.mediaDevices?.getUserMedia)
  const hasWebGL = detectWebGL()

  const cores = navigator.hardwareConcurrency || 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  let tier: DeviceTier = 'high'
  if (cores <= 4 || memory <= 2 || dpr >= 3) tier = 'mid'
  if (cores <= 2 || memory <= 2 || prefersReducedMotion) tier = 'low'
  if (/iPhone\s(8|7|6|SE)/i.test(ua)) tier = 'low'

  return {
    tier,
    isMobile,
    isDesktop,
    maxPixelRatio: tier === 'high' ? 1.75 : tier === 'mid' ? 1.35 : 1.1,
    particleScale: tier === 'high' ? 1 : tier === 'mid' ? 0.7 : 0.45,
    antialias: tier === 'high',
    prefersReducedMotion,
    hasWebGL,
    hasGetUserMedia,
  }
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}

export function isLikelyDesktop(): boolean {
  return detectDeviceCapability().isDesktop
}
