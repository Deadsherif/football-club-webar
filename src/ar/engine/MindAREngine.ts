import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import type { BaseARScene } from '@/ar/scenes/BaseARScene'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { PERFORMANCE } from '@/config/performance'
import type { CinematicPhase, SceneDefinition, TrackingState } from '@/types/ar'

export interface MindAREngineOptions {
  container: HTMLElement
  sceneDef: SceneDefinition
  arScene: BaseARScene
  onTrackingChange?: (state: TrackingState) => void
  onCinematicPhase?: (phase: CinematicPhase) => void
  onError?: (error: Error) => void
}

/**
 * Owns MindAR + Three.js lifecycle.
 * Scenes attach content to the image anchor; they never touch MindAR directly.
 */
export class MindAREngine {
  private mindar: MindARThree | null = null
  private arScene: BaseARScene
  private lastFrameTime = 0
  private running = false
  private readonly onTrackingChange?: (state: TrackingState) => void
  private readonly onCinematicPhase?: (phase: CinematicPhase) => void
  private readonly onError?: (error: Error) => void
  private readonly container: HTMLElement
  private readonly sceneDef: SceneDefinition

  constructor(options: MindAREngineOptions) {
    this.container = options.container
    this.sceneDef = options.sceneDef
    this.arScene = options.arScene
    this.onTrackingChange = options.onTrackingChange
    this.onCinematicPhase = options.onCinematicPhase
    this.onError = options.onError
  }

  async start(): Promise<void> {
    if (this.running) return

    const mindar = new MindARThree({
      container: this.container,
      imageTargetSrc: this.sceneDef.imageTargetSrc,
      uiLoading: false,
      uiScanning: false,
      uiError: false,
      warmupTolerance: PERFORMANCE.warmupTolerance,
      missTolerance: PERFORMANCE.missTolerance,
    })

    this.mindar = mindar

    const { renderer, scene, camera } = mindar

    // Mobile-oriented renderer tuning
    const capability = detectDeviceCapability()
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      capability.maxPixelRatio || PERFORMANCE.maxPixelRatio,
    )
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)
    // three@0.159 (MindAR-compatible): use outputEncoding
    renderer.outputEncoding = THREE.sRGBEncoding
    if ('antialias' in renderer) {
      /* constructed by MindAR — capability used for DPR only */
    }

    const anchor = mindar.addAnchor(0)
    anchor.onTargetFound = () => this.arScene.onTargetFound()
    anchor.onTargetLost = () => this.arScene.onTargetLost()

    this.arScene.setHooks({
      onTrackingChange: (state) => this.onTrackingChange?.(state),
      onCinematicPhase: (phase) => this.onCinematicPhase?.(phase),
    })

    await this.arScene.setup({
      scene,
      renderer,
      camera,
      anchorGroup: anchor.group,
    })

    try {
      await mindar.start()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.onError?.(error)
      this.dispose()
      throw error
    }

    // MindAR sets video z-index to -2, which can paint behind the parent's
    // opaque background and look like "LED on, black screen".
    this.fixVideoLayer()
    try {
      ;(mindar as { resize?: () => void }).resize?.()
    } catch {
      // optional
    }

    this.running = true
    this.lastFrameTime = performance.now()

    renderer.setAnimationLoop(() => {
      const now = performance.now()
      const delta = Math.min(0.05, (now - this.lastFrameTime) / 1000)
      this.lastFrameTime = now
      this.arScene.update(delta)
      renderer.render(scene, camera)
    })
  }

  /** Keep camera feed visible above container backgrounds. */
  private fixVideoLayer(): void {
    const video = this.container.querySelector('video')
    if (video) {
      video.style.zIndex = '0'
      video.style.objectFit = 'cover'
      video.style.width = '100%'
      video.style.height = '100%'
      video.muted = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      void video.play().catch(() => {
        // Autoplay may need a gesture; stream is still attached.
      })
    }

    this.container.querySelectorAll('canvas').forEach((canvas, index) => {
      canvas.style.zIndex = String(1 + index)
      canvas.style.pointerEvents = 'none'
    })
  }

  stop(): void {
    this.dispose()
  }

  private dispose(): void {
    this.running = false

    if (this.mindar) {
      try {
        this.mindar.renderer.setAnimationLoop(null)
        this.mindar.stop()
      } catch {
        // MindAR may throw if start() never completed — safe to ignore.
      }
      this.mindar = null
    }

    this.arScene.dispose()

    // Remove leftover video/canvas nodes MindAR injects into the container.
    this.container.replaceChildren()
  }
}
