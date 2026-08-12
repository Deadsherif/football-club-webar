import * as THREE from 'three'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import type { BaseARScene } from '@/ar/scenes/BaseARScene'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { PERFORMANCE } from '@/config/performance'
import type { CinematicPhase, SceneDefinition, TrackingState } from '@/types/ar'
import type { ClubContentMode } from '@/ar/scenes/ClubCrestScene'
import type { LegendPlayer } from '@/data/players'
import type { President } from '@/data/presidents'
import type { BoardMemberCard } from '@/data/boardMembers'
import type { RedCastleMember } from '@/data/redCastleMembers'
import type { TrophyDefinition } from '@/data/trophies'
import { attachStudioEnvironment } from '@/ar/effects/studioEnvironment'
import { publicUrl } from '@/utils/publicUrl'

interface InteractiveContentScene {
  setContentMode?: (mode: ClubContentMode) => void
  setContentModeHandler?: (handler: (mode: ClubContentMode) => void) => void
  setLegendSquad?: (squadId: string) => void
  selectLegendPlayer?: (playerId: string | null) => void
  setLegendSelectionHandler?: (
    handler: (player: LegendPlayer | null) => void,
  ) => void
  selectPresident?: (presidentId: string | null) => void
  setPresidentSelectionHandler?: (
    handler: (president: President | null) => void,
  ) => void
  selectBoardMember?: (memberId: string | null) => void
  setBoardSelectionHandler?: (
    handler: (member: BoardMemberCard | null) => void,
  ) => void
  selectRedCastleMember?: (memberId: string | null) => void
  setRedCastleSelectionHandler?: (
    handler: (member: RedCastleMember | null) => void,
  ) => void
  selectTrophy?: (trophyId: string | null) => void
  setTrophySelectionHandler?: (
    handler: (trophy: TrophyDefinition | null) => void,
  ) => void
  onPointerTap?: (pointer: THREE.Vector2, camera: THREE.Camera) => void
}

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
  private onPointerUp: ((event: PointerEvent) => void) | null = null
  private disposeEnvironment: (() => void) | null = null
  private onViewportResize: (() => void) | null = null
  private resizeObserver: ResizeObserver | null = null

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
      imageTargetSrc: publicUrl(this.sceneDef.imageTargetSrc),
      uiLoading: false,
      uiScanning: false,
      uiError: false,
      warmupTolerance: PERFORMANCE.warmupTolerance,
      missTolerance: PERFORMANCE.missTolerance,
      filterMinCF: PERFORMANCE.filterMinCF,
      filterBeta: PERFORMANCE.filterBeta,
    })

    this.mindar = mindar

    const { renderer, scene, camera } = mindar

    const capability = detectDeviceCapability()
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      capability.maxPixelRatio || PERFORMANCE.maxPixelRatio,
    )
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    this.disposeEnvironment = attachStudioEnvironment(renderer, scene, 0.95)

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
    this.installPointerHandler(camera)

    try {
      await mindar.start()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.onError?.(error)
      this.dispose()
      throw error
    }

    this.fixVideoLayer()
    this.syncRendererSize()
    try {
      ;(mindar as { resize?: () => void }).resize?.()
    } catch {
      // optional
    }
    this.installViewportListeners()

    // MindAR often injects / restyles video a frame late on mobile.
    requestAnimationFrame(() => {
      this.fixVideoLayer()
      this.syncRendererSize()
      requestAnimationFrame(() => this.fixVideoLayer())
    })

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

  private installViewportListeners(): void {
    this.onViewportResize = () => {
      this.fixVideoLayer()
      this.syncRendererSize()
      try {
        ;(this.mindar as { resize?: () => void } | null)?.resize?.()
      } catch {
        // optional
      }
    }
    window.addEventListener('resize', this.onViewportResize)
    window.addEventListener('orientationchange', this.onViewportResize)
    window.visualViewport?.addEventListener('resize', this.onViewportResize)
    window.visualViewport?.addEventListener('scroll', this.onViewportResize)

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.onViewportResize?.())
      this.resizeObserver.observe(this.container)
    }
  }

  private syncRendererSize(): void {
    const renderer = this.mindar?.renderer
    if (!renderer) return
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    renderer.setSize(w, h, false)
  }

  private fixVideoLayer(): void {
    const video = this.container.querySelector('video')
    if (video) {
      video.style.position = 'absolute'
      video.style.inset = '0'
      video.style.top = '0'
      video.style.left = '0'
      video.style.right = '0'
      video.style.bottom = '0'
      video.style.zIndex = '0'
      video.style.objectFit = 'cover'
      video.style.objectPosition = 'center'
      video.style.width = '100%'
      video.style.height = '100%'
      video.style.minWidth = '100%'
      video.style.minHeight = '100%'
      video.style.maxWidth = 'none'
      video.style.maxHeight = 'none'
      video.style.transform = 'translateZ(0)'
      video.muted = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      void video.play().catch(() => {})
    }

    this.container.querySelectorAll('canvas').forEach((canvas, index) => {
      canvas.style.position = 'absolute'
      canvas.style.inset = '0'
      canvas.style.top = '0'
      canvas.style.left = '0'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.minWidth = '100%'
      canvas.style.minHeight = '100%'
      canvas.style.zIndex = String(1 + index)
      canvas.style.pointerEvents = 'none'
    })
  }

  stop(): void {
    this.dispose()
  }

  private dispose(): void {
    this.running = false

    if (this.onViewportResize) {
      window.removeEventListener('resize', this.onViewportResize)
      window.removeEventListener('orientationchange', this.onViewportResize)
      window.visualViewport?.removeEventListener('resize', this.onViewportResize)
      window.visualViewport?.removeEventListener('scroll', this.onViewportResize)
      this.onViewportResize = null
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = null

    if (this.mindar) {
      try {
        this.mindar.renderer.setAnimationLoop(null)
        this.mindar.stop()
      } catch {
        // ignore
      }
      this.mindar = null
    }

    this.arScene.dispose()
    this.disposeEnvironment?.()
    this.disposeEnvironment = null
    if (this.onPointerUp) {
      this.container.removeEventListener('pointerup', this.onPointerUp)
      this.onPointerUp = null
    }

    this.container.replaceChildren()
  }

  setContentMode(mode: ClubContentMode): void {
    ;(this.arScene as InteractiveContentScene).setContentMode?.(mode)
  }

  setContentModeHandler(handler: (mode: ClubContentMode) => void): void {
    ;(this.arScene as InteractiveContentScene).setContentModeHandler?.(handler)
  }

  setLegendSquad(squadId: string): void {
    ;(this.arScene as InteractiveContentScene).setLegendSquad?.(squadId)
  }

  selectLegendPlayer(playerId: string | null): void {
    ;(this.arScene as InteractiveContentScene).selectLegendPlayer?.(playerId)
  }

  setLegendSelectionHandler(
    handler: (player: LegendPlayer | null) => void,
  ): void {
    ;(this.arScene as InteractiveContentScene).setLegendSelectionHandler?.(
      handler,
    )
  }

  selectPresident(presidentId: string | null): void {
    ;(this.arScene as InteractiveContentScene).selectPresident?.(presidentId)
  }

  setPresidentSelectionHandler(
    handler: (president: President | null) => void,
  ): void {
    ;(this.arScene as InteractiveContentScene).setPresidentSelectionHandler?.(
      handler,
    )
  }

  selectBoardMember(memberId: string | null): void {
    ;(this.arScene as InteractiveContentScene).selectBoardMember?.(memberId)
  }

  setBoardSelectionHandler(
    handler: (member: BoardMemberCard | null) => void,
  ): void {
    ;(this.arScene as InteractiveContentScene).setBoardSelectionHandler?.(
      handler,
    )
  }

  selectRedCastleMember(memberId: string | null): void {
    ;(this.arScene as InteractiveContentScene).selectRedCastleMember?.(memberId)
  }

  setRedCastleSelectionHandler(
    handler: (member: RedCastleMember | null) => void,
  ): void {
    ;(this.arScene as InteractiveContentScene).setRedCastleSelectionHandler?.(
      handler,
    )
  }

  selectTrophy(trophyId: string | null): void {
    ;(this.arScene as InteractiveContentScene).selectTrophy?.(trophyId)
  }

  setTrophySelectionHandler(
    handler: (trophy: TrophyDefinition | null) => void,
  ): void {
    ;(this.arScene as InteractiveContentScene).setTrophySelectionHandler?.(
      handler,
    )
  }

  private installPointerHandler(camera: THREE.Camera): void {
    this.onPointerUp = (event) => {
      const target = event.target
      if (target instanceof Element && target.closest('button')) return

      const rect = this.container.getBoundingClientRect()
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      ;(this.arScene as InteractiveContentScene).onPointerTap?.(pointer, camera)
    }
    this.container.addEventListener('pointerup', this.onPointerUp)
  }
}
