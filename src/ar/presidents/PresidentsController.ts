import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PresidentsWorld } from '@/ar/presidents/PresidentsWorld'
import { presidents, getPresidentIndex } from '@/data/presidents'
import { audio } from '@/services/audioService'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import {
  getStadiumViewportFit,
  type StadiumViewportFit,
} from '@/utils/stadiumViewport'
import { attachStudioEnvironment } from '@/ar/effects/studioEnvironment'
import {
  computeJourneySplitFraming,
  computeStableCardFraming,
  holdSelectCamera,
} from '@/ar/engine/stableSelectCamera'
import {
  CARD_CABINET_DISTANCE_SCALE,
  applyStadiumExploreFraming,
  getStadiumIdleOrbitCam,
  getStadiumIntroLightsCam,
} from '@/ar/stadium/stadiumExploreFraming'

export type PresidentsPhase =
  | 'boot'
  | 'titles'
  | 'lights'
  | 'reveal'
  | 'tagline'
  | 'explore'
  | 'selected'

export interface PresidentsControllerHooks {
  onPhase?: (phase: PresidentsPhase) => void
  onHover?: (id: string | null) => void
  onSelect?: (id: string | null) => void
  onYearLabel?: (label: string) => void
}

/**
 * Free WebGL presidents experience (desktop demos + non-AR mobile).
 * Raycasting, cinematic camera, intro timeline.
 */
export class PresidentsController {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private world = new PresidentsWorld()
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private clock = new THREE.Clock()
  private running = false
  private raf = 0
  private phase: PresidentsPhase = 'boot'
  private phaseTime = 0
  private hoveredId: string | null = null
  private selectedId: string | null = null
  private selectedIndex = -1
  private hooks: PresidentsControllerHooks = {}
  private cameraTarget = new THREE.Vector3(0, 1.2, 4.2)
  private lookTarget = new THREE.Vector3(0, 0.9, 0)
  private desiredCam = new THREE.Vector3(0, 1.2, 4.2)
  private desiredLook = new THREE.Vector3(0, 0.9, 0)
  private idleOrbit = 0
  private hasUserNavigated = false
  private transitionBannerUntil = 0
  /** Soft zoom-out after closing a focused card. */
  private zoomOutUntil = 0
  private container: HTMLElement
  private fit: StadiumViewportFit
  private disposeEnvironment: (() => void) | null = null
  private storyLocked = false
  private freeLook = false
  private draggingModel = false
  private lastPointerX = 0
  private journeyEntranceDone = false
  private pendingJourneyItemId: string | null = null
  private onPointerMove: (e: PointerEvent) => void
  private onPointerDown: (e: PointerEvent) => void
  private onPointerUp: (e: PointerEvent) => void
  private onResize: () => void

  constructor(container: HTMLElement) {
    this.container = container
    const capability = detectDeviceCapability()
    this.fit = getStadiumViewportFit(container.clientWidth, container.clientHeight)
    this.renderer = new THREE.WebGLRenderer({
      antialias: capability.antialias,
      alpha: false,
      powerPreference: 'default',
    })
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, capability.maxPixelRatio),
    )
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x050203, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      this.fit.fov,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      40,
    )
    this.camera.position.copy(this.cameraTarget)

    this.scene.fog = new THREE.FogExp2(0x080305, 0.04)
    this.scene.add(this.world.root)
    this.disposeEnvironment = attachStudioEnvironment(this.renderer, this.scene, 1)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enableRotate = true
    this.controls.enableZoom = true
    this.controls.enablePan = false
    this.controls.maxPolarAngle = Math.PI * 0.48
    this.controls.minPolarAngle = Math.PI * 0.16
    this.controls.minDistance = this.fit.minDistance
    this.controls.maxDistance = this.fit.maxDistance
    this.controls.target.copy(this.lookTarget)
    this.controls.enabled = false
    this.controls.addEventListener('start', () => {
      this.hasUserNavigated = true
    })

    this.onPointerMove = (e) => this.handlePointerMove(e)
    this.onPointerDown = (e) => this.handlePointer(e, true)
    this.onPointerUp = (e) => this.handlePointerUp(e)
    this.onResize = () => this.resize()
  }

  setHooks(hooks: PresidentsControllerHooks): void {
    this.hooks = hooks
  }

  /** When true, raycast taps are ignored (guided journey owns selection). */
  setStoryLocked(locked: boolean): void {
    this.storyLocked = locked
    this.syncControlsEnabled()
  }

  /** Allow orbit while journey is active so cards stay inspectable. */
  setFreeLook(enabled: boolean): void {
    this.freeLook = enabled
    this.syncControlsEnabled()
  }

  /** Orbit/zoom: always on in cabinet; focused card needs freeLook (EDIT VIEW). */
  private syncControlsEnabled(): void {
    if (performance.now() < this.zoomOutUntil) {
      this.controls.enabled = false
      return
    }
    if (this.phase !== 'explore' && this.phase !== 'selected') {
      this.controls.enabled = false
      return
    }
    if (!this.selectedId) {
      this.controls.enabled = true
      return
    }
    this.controls.enabled = this.freeLook
  }

  /** Jump past cinematic intro to the full cabinet. */
  skipToExplore(): void {
    this.world.setIntroProgress(1)
    this.journeyEntranceDone = true
    this.resize()
    this.clearSelection()
    this.applyExploreFraming()
    this.camera.position.copy(this.cameraTarget)
    this.controls.target.copy(this.lookTarget)
    this.setPhase('explore')
    this.controls.enabled = true
  }

  selectById(id: string): void {
    const index = getPresidentIndex(id)
    if (index < 0) return
    this.selectByIndex(index)
  }

  /**
   * Journey: play intro once, then show the full cabinet (no card open).
   */
  enterJourneyCabinet(): void {
    this.storyLocked = true
    this.pendingJourneyItemId = null
    if (
      !this.journeyEntranceDone &&
      this.phase !== 'explore' &&
      this.phase !== 'selected'
    ) {
      if (this.phase === 'boot' || this.phase === 'titles') {
        this.setPhase('lights')
      }
      return
    }
    this.journeyEntranceDone = true
    if (this.selectedId) this.clearSelection()
    else this.applyExploreFraming()
  }

  /**
   * Journey Next/Prev: open this step's card (keeps detail view).
   */
  showJourneyItem(itemId: string): void {
    this.storyLocked = true
    if (
      !this.journeyEntranceDone &&
      this.phase !== 'explore' &&
      this.phase !== 'selected'
    ) {
      this.pendingJourneyItemId = itemId
      if (this.phase === 'boot' || this.phase === 'titles') {
        this.setPhase('lights')
      }
      return
    }
    this.journeyEntranceDone = true
    this.pendingJourneyItemId = null
    this.selectById(itemId)
  }

  async start(): Promise<void> {
    await this.world.setup()
    this.applyExploreFraming()
    this.camera.position.copy(this.cameraTarget)
    this.controls.target.copy(this.lookTarget)
    this.running = true
    this.setPhase('titles')
    void audio.unlock()
    window.addEventListener('resize', this.onResize)
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp)
    this.renderer.domElement.addEventListener('pointercancel', this.onPointerUp)
    this.clock.start()
    this.tick()
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp)
    this.renderer.domElement.removeEventListener('pointercancel', this.onPointerUp)
    this.world.dispose()
    this.controls.dispose()
    this.disposeEnvironment?.()
    this.disposeEnvironment = null
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  selectByIndex(index: number): void {
    const clamped = (index + presidents.length) % presidents.length
    const president = presidents[clamped]
    this.selectedIndex = clamped
    this.selectedId = president.id
    this.hooks.onSelect?.(this.selectedId)
    this.hooks.onYearLabel?.(president.yearsLabel)
    this.setPhase('selected')
    this.transitionBannerUntil = performance.now() + 1200
    void audio.play('ui')
    this.world.getCardById(president.id)?.snapIn()
    void this.world.setFocus(this.selectedId, null, this.camera).then(() => {
      if (this.selectedId !== president.id) return
      if (this.storyLocked) {
        this.world.applyJourneySplit(president.id, this.fit.isPortrait)
      } else {
        this.world.clearJourneySplit()
      }
      this.resize()
      this.focusCameraOn(president.id)
      // Second pass after layout settles (first journey enter can race intro/scale).
      requestAnimationFrame(() => {
        if (this.selectedId !== president.id) return
        if (this.storyLocked) {
          this.world.applyJourneySplit(president.id, this.fit.isPortrait)
        }
        this.focusCameraOn(president.id)
      })
    })
  }

  next(): void {
    if (this.selectedIndex < 0) this.selectByIndex(0)
    else this.selectByIndex(this.selectedIndex + 1)
  }

  prev(): void {
    if (this.selectedIndex < 0) this.selectByIndex(0)
    else this.selectByIndex(this.selectedIndex - 1)
  }

  clearSelection(): void {
    this.selectedId = null
    this.selectedIndex = -1
    this.hooks.onSelect?.(null)
    this.setPhase('explore')
    this.hasUserNavigated = false
    this.controls.enabled = false
    this.zoomOutUntil = performance.now() + 1500
    this.world.clearJourneySplit()
    // Desired explore pose only — camera lerps from the focused view.
    this.applyExploreFraming(false)
    void this.world.setFocus(null, this.hoveredId, this.camera)
  }

  getSelectedId(): string | null {
    return this.selectedId
  }

  isShowingTransitionBanner(): boolean {
    return performance.now() < this.transitionBannerUntil
  }

  private applyExploreFraming(snapLook = true): void {
    applyStadiumExploreFraming(
      this.world.floatingCardAltitude,
      this.fit,
      this.cameraTarget,
      this.lookTarget,
      this.desiredCam,
      this.desiredLook,
      CARD_CABINET_DISTANCE_SCALE,
      snapLook,
    )
  }

  private tick = (): void => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.tick)
    const delta = Math.min(0.05, this.clock.getDelta())
    const time = this.clock.elapsedTime
    this.phaseTime += delta

    this.updateIntro(delta)
    this.world.update(time, delta)

    const zoomingOut = performance.now() < this.zoomOutUntil
    const userOrbiting = this.controls.enabled && this.hasUserNavigated
    if (zoomingOut) {
      const camSpeed = 4.2
      const lookSpeed = 4.6
      this.camera.position.lerp(this.desiredCam, 1 - Math.exp(-delta * camSpeed))
      this.lookTarget.lerp(this.desiredLook, 1 - Math.exp(-delta * lookSpeed))
      this.controls.target.copy(this.lookTarget)
      this.camera.lookAt(this.lookTarget)
    } else if (this.selectedId && !this.freeLook) {
      holdSelectCamera(
        this.camera,
        this.desiredCam,
        this.lookTarget,
        this.desiredLook,
        this.controls.target,
      )
    } else if (userOrbiting) {
      this.controls.update()
      this.desiredCam.copy(this.camera.position)
      this.lookTarget.copy(this.controls.target)
      this.desiredLook.copy(this.lookTarget)
    } else {
      this.camera.position.lerp(this.desiredCam, 1 - Math.exp(-delta * 2.2))
      this.lookTarget.lerp(this.desiredLook, 1 - Math.exp(-delta * 2.4))
      this.controls.target.copy(this.lookTarget)
      if (this.controls.enabled) this.controls.update()
      else this.camera.lookAt(this.lookTarget)
    }

    if (this.phase === 'explore' && !this.selectedId) {
      if (!this.hasUserNavigated && !zoomingOut) {
        this.idleOrbit += delta * 0.12
        getStadiumIdleOrbitCam(
          this.world.floatingCardAltitude,
          this.fit,
          this.idleOrbit,
          this.desiredCam,
          CARD_CABINET_DISTANCE_SCALE,
        )
      }
      if (!zoomingOut && this.zoomOutUntil > 0) {
        this.zoomOutUntil = 0
        this.syncControlsEnabled()
        this.controls.target.copy(this.lookTarget)
      }
    }

    this.renderer.render(this.scene, this.camera)
  }

  private updateIntro(_delta: number): void {
    const fast = this.storyLocked
    if (this.phase === 'titles') {
      if (this.phaseTime > (fast ? 0.4 : 1.6)) {
        this.setPhase('lights')
      }
      return
    }

    if (this.phase === 'lights') {
      const t = Math.min(0.4, this.phaseTime / (fast ? 0.85 : 2.0))
      this.world.setIntroProgress(t)
      getStadiumIntroLightsCam(
        this.world.floatingCardAltitude,
        this.fit,
        this.desiredCam,
        CARD_CABINET_DISTANCE_SCALE,
      )
      if (this.phaseTime > (fast ? 0.85 : 2.0)) this.setPhase('reveal')
      return
    }

    if (this.phase === 'reveal') {
      const t = Math.min(
        1,
        0.4 + (this.phaseTime / (fast ? 1.5 : 3.2)) * 0.6,
      )
      this.world.setIntroProgress(t)
      if (t >= 1) this.setPhase('tagline')
      return
    }

    if (this.phase === 'tagline' && this.phaseTime > (fast ? 0.35 : 2.2)) {
      this.setPhase('explore')
      this.journeyEntranceDone = true
      this.syncControlsEnabled()
      const pending = this.pendingJourneyItemId
      if (pending) {
        this.pendingJourneyItemId = null
        this.selectById(pending)
      }
    }
  }

  private setPhase(phase: PresidentsPhase): void {
    this.phase = phase
    this.phaseTime = 0
    this.hooks.onPhase?.(phase)
  }

  flipSelected(): void {
    if (!this.selectedId) return
    this.world.getCardById(this.selectedId)?.toggleFlip()
    void audio.play('ui')
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.storyLocked && this.draggingModel) {
      const dx = e.clientX - this.lastPointerX
      this.lastPointerX = e.clientX
      this.world.addJourneySpin(dx * 0.012)
      return
    }
    this.handlePointer(e, false)
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.draggingModel) return
    this.draggingModel = false
    try {
      this.renderer.domElement.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }

  private handlePointer(e: PointerEvent, isDown: boolean): void {
    if (this.phase !== 'explore' && this.phase !== 'selected') return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)

    // Only the portrait faces count — not glow / empty space.
    const faceMeshes = this.world.cards.flatMap((c) => [c.meshFront, c.meshBack])
    const hits = this.raycaster.intersectObjects(faceMeshes, false)
    const id = hits[0]?.object.userData.presidentId as string | undefined

    if (!isDown) {
      if (id !== this.hoveredId) {
        this.hoveredId = id ?? null
        void this.world.setFocus(this.selectedId, this.hoveredId, this.camera)
        this.hooks.onHover?.(this.hoveredId)
      }
      return
    }

    // Flip / open only when the click lands on a card face.
    if (id && id === this.selectedId) {
      this.flipSelected()
      return
    }
    if (id) {
      this.selectById(id)
      return
    }

    // Rotate the crest/stadium only when dragging on the model itself.
    if (this.storyLocked && this.selectedId && this.world.hitTestModel(this.raycaster)) {
      this.draggingModel = true
      this.lastPointerX = e.clientX
      this.renderer.domElement.setPointerCapture(e.pointerId)
      return
    }

    if (!this.storyLocked && this.selectedId) {
      this.clearSelection()
    }
  }

  private focusCameraOn(id: string): void {
    const card = this.world.getCardById(id)
    if (!card) return

    // Journey presidents only: two-column framing (model left, card right).
    const framing = this.storyLocked
      ? computeJourneySplitFraming(this.world.floatingCardAltitude, this.fit)
      : (() => {
          const parent = card.group.parent
          const home = card.anim.basePosition.clone()
          if (parent) parent.localToWorld(home)
          else home.copy(card.anim.basePosition)
          return computeStableCardFraming(home, this.fit)
        })()

    this.desiredLook.copy(framing.look)
    this.desiredCam.copy(framing.cam)
    this.hasUserNavigated = false
    holdSelectCamera(
      this.camera,
      this.desiredCam,
      this.lookTarget,
      this.desiredLook,
      this.controls.target,
    )
    this.syncControlsEnabled()
  }

  private resize(): void {
    const w = this.container.clientWidth
    const h = Math.max(1, this.container.clientHeight)
    this.fit = getStadiumViewportFit(w, h)
    this.camera.fov = this.fit.fov
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.controls.minDistance = this.fit.minDistance
    this.controls.maxDistance = this.fit.maxDistance
    this.renderer.setSize(w, h)
    if (this.selectedId && this.storyLocked) {
      this.world.applyJourneySplit(this.selectedId, this.fit.isPortrait)
      this.focusCameraOn(this.selectedId)
      return
    }
    if (!this.selectedId) this.applyExploreFraming()
  }
}
