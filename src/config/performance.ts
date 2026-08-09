/**
 * Mobile WebGL / MindAR performance defaults.
 * Tuned for Safari iOS and Chrome Android.
 */
export const PERFORMANCE = {
  /** Cap DPR — 2 is usually enough on phones and saves GPU time. */
  maxPixelRatio: 1.75,
  /** Prefer power-saving GPU when available. */
  powerPreference: 'default' as WebGLPowerPreference,
  antialias: false,
  /** Soft miss/warmup for more stable phone tracking. */
  warmupTolerance: 5,
  missTolerance: 5,
} as const
