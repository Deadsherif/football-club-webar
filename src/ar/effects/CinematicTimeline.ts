import type { CinematicPhase } from '@/types/ar'
import { windowProgress } from '@/ar/effects/easing'

export interface CinematicBeats {
  glow: number
  particles: number
  portal: number
  stadiumRise: number
  lights: number
  ambience: number
  orbit: number
  legacy: number
  title: number
  letterbox: number
}

export const CINEMATIC_TIMING = {
  glowPeak: 0.55,
  particlesAt: 0.15,
  portalStart: 0.35,
  portalEnd: 1.45,
  stadiumStart: 1.05,
  stadiumEnd: 3.1,
  lightsStart: 1.8,
  lightsEnd: 2.8,
  ambienceStart: 2.0,
  orbitStart: 1.4,
  orbitEnd: 4.2,
  legacyAt: 3.0,
  titleAt: 4.0,
  completeAt: 5.2,
} as const

export class CinematicTimeline {
  private elapsed = 0
  private playing = false
  private phase: CinematicPhase = 'idle'
  private onPhase?: (phase: CinematicPhase) => void
  private firedParticles = false
  private firedLegacy = false
  private firedTitle = false

  setPhaseListener(cb: (phase: CinematicPhase) => void): void {
    this.onPhase = cb
  }

  start(): void {
    this.elapsed = 0
    this.playing = true
    this.firedParticles = false
    this.firedLegacy = false
    this.firedTitle = false
    this.setPhase('glow')
  }

  stop(): void {
    this.playing = false
    this.elapsed = 0
    this.setPhase('idle')
  }

  get isPlaying(): boolean {
    return this.playing
  }

  get currentPhase(): CinematicPhase {
    return this.phase
  }

  update(delta: number): CinematicBeats & {
    justParticles: boolean
    justLegacy: boolean
    justTitle: boolean
  } {
    if (!this.playing) {
      return {
        glow: 0,
        particles: 0,
        portal: 0,
        stadiumRise: 0,
        lights: 0,
        ambience: 0,
        orbit: 0,
        legacy: 0,
        title: 0,
        letterbox: 0,
        justParticles: false,
        justLegacy: false,
        justTitle: false,
      }
    }

    this.elapsed += delta
    const t = this.elapsed
    const T = CINEMATIC_TIMING

    let justParticles = false
    let justLegacy = false
    let justTitle = false

    if (!this.firedParticles && t >= T.particlesAt) {
      this.firedParticles = true
      justParticles = true
      this.setPhase('particles')
    }

    const portal = windowProgress(t, T.portalStart, T.portalEnd)
    if (portal > 0.05 && t < T.stadiumStart + 0.35) this.setPhase('portal')

    const stadiumRise = windowProgress(t, T.stadiumStart, T.stadiumEnd)
    if (stadiumRise > 0.05 && stadiumRise < 1) this.setPhase('stadium-rise')
    if (t >= T.orbitStart && t < T.legacyAt) this.setPhase('settle')

    if (!this.firedLegacy && t >= T.legacyAt) {
      this.firedLegacy = true
      justLegacy = true
      this.setPhase('legacy')
    }

    if (!this.firedTitle && t >= T.titleAt) {
      this.firedTitle = true
      justTitle = true
      this.setPhase('title')
    }

    if (t >= T.completeAt) this.setPhase('complete')

    const glow =
      t < T.glowPeak
        ? windowProgress(t, 0, T.glowPeak)
        : 0.78 + Math.sin((t - T.glowPeak) * 2.2) * 0.14

    return {
      glow: Math.min(1, glow),
      particles: windowProgress(t, T.particlesAt, T.particlesAt + 0.2),
      portal,
      stadiumRise,
      lights: windowProgress(t, T.lightsStart, T.lightsEnd),
      ambience: windowProgress(t, T.ambienceStart, T.ambienceStart + 1.2),
      orbit: windowProgress(t, T.orbitStart, T.orbitEnd),
      legacy: windowProgress(t, T.legacyAt, T.legacyAt + 0.7),
      title: windowProgress(t, T.titleAt, T.titleAt + 0.8),
      letterbox:
        t < T.titleAt
          ? windowProgress(t, 0.2, 1.0) *
            (1 - windowProgress(t, 4.6, 5.2) * 0.55)
          : 0.28,
      justParticles,
      justLegacy,
      justTitle,
    }
  }

  private setPhase(phase: CinematicPhase): void {
    if (this.phase === phase) return
    this.phase = phase
    this.onPhase?.(phase)
  }
}
