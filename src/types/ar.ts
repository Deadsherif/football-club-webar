export type AppPhase =
  | 'landing'
  | 'intro'
  | 'loading'
  | 'ar'
  | 'camera-error'
  | 'unsupported'
  | 'fallback'
  | 'desktop'
  | 'presidents'
  | 'legends'
  | 'trophies'
  | 'board'
  | 'red-castle'

export type CameraErrorKind =
  | 'denied'
  | 'unavailable'
  | 'insecure'
  | 'unknown'

export interface CameraPermissionResult {
  ok: boolean
  error?: CameraErrorKind
  message?: string
}

export interface AssetLoadProgress {
  loaded: number
  total: number
  url: string
  ratio: number
}

export interface SceneDefinition {
  id: string
  nameAr: string
  nameEn: string
  imageTargetSrc: string
  targetPreviewSrc: string
  modelSrc: string
}

export type TrackingState = 'searching' | 'tracking' | 'lost'

export type CinematicPhase =
  | 'idle'
  | 'glow'
  | 'particles'
  | 'portal'
  | 'stadium-rise'
  | 'settle'
  | 'legacy'
  | 'title'
  | 'complete'

export type ExploreSection =
  | 'history'
  | 'trophies'
  | 'future'
  | 'board'
  | 'red-castle'
  | null

export type Locale = 'en' | 'ar'
