export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t)
  return 1 - Math.pow(1 - x, 3)
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export function easeOutBack(t: number): number {
  const x = clamp01(t)
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

export function easeOutElastic(t: number): number {
  const x = clamp01(t)
  if (x === 0 || x === 1) return x
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

/** Smoothstep remap of a global time into a local [0,1] window. */
export function windowProgress(
  time: number,
  start: number,
  end: number,
): number {
  if (end <= start) return time >= end ? 1 : 0
  return clamp01((time - start) / (end - start))
}
