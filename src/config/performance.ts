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
  /**
   * MindAR One Euro Filter — lower cutoff = smoother (less shake),
   * lower beta = less overshoot when the phone moves.
   */
  filterMinCF: 0.00015,
  filterBeta: 40,
  /** Need more confirmed frames before locking the crest. */
  warmupTolerance: 10,
  /** Tolerate brief tracking gaps without hiding the stadium. */
  missTolerance: 18,
} as const
