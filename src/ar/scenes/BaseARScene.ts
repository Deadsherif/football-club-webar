import type { Group, Scene as ThreeScene, WebGLRenderer, Camera } from 'three'
import type { CinematicPhase, TrackingState } from '@/types/ar'

export interface ARSceneContext {
  scene: ThreeScene
  renderer: WebGLRenderer
  camera: Camera
  /** MindAR anchor group — children stay locked to the tracked image. */
  anchorGroup: Group
}

export interface ARSceneHooks {
  onTrackingChange?: (state: TrackingState) => void
  onCinematicPhase?: (phase: CinematicPhase) => void
}

/**
 * Abstract AR scene. New experiences (stadium, trophies, …) extend this
 * and register via SceneRegistry — engine code stays unchanged.
 */
export abstract class BaseARScene {
  protected ctx: ARSceneContext | null = null
  protected hooks: ARSceneHooks = {}
  protected trackingState: TrackingState = 'searching'
  protected disposed = false

  abstract readonly id: string

  setHooks(hooks: ARSceneHooks): void {
    this.hooks = hooks
  }

  /** Called once after MindAR + anchor are ready. Load models here. */
  abstract setup(ctx: ARSceneContext): Promise<void>

  /** Per-frame update while AR is running. */
  update(_deltaSeconds: number): void {
    // Optional override
  }

  onTargetFound(): void {
    this.setTrackingState('tracking')
  }

  onTargetLost(): void {
    this.setTrackingState('lost')
  }

  dispose(): void {
    this.disposed = true
    this.ctx = null
  }

  protected setTrackingState(state: TrackingState): void {
    this.trackingState = state
    this.hooks.onTrackingChange?.(state)
  }

  protected emitCinematicPhase(phase: CinematicPhase): void {
    this.hooks.onCinematicPhase?.(phase)
  }
}
