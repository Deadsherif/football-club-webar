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
  computeStableCardFraming,
  holdSelectCamera,
} from '@/ar/engine/stableSelectCamera'

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
  private container: HTMLElement
  private fit: StadiumViewportFit
  private disposeEnvironment: (() => void) | null = null
  private onPointerMove: (e: PointerEvent) => void
  private onPointerDown: (e: PointerEvent) => void
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

    this.onPointerMove = (e) => this.handlePointer(e, false)
    this.onPointerDown = (e) => this.handlePointer(e, true)
    this.onResize = () => this.resize()
  }

  setHooks(hooks: PresidentsControllerHooks): void {
    this.hooks = hooks
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
    this.clock.start()
    this.tick()
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
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
    this.world.setFocus(this.selectedId, null, this.camera)
    this.focusCameraOn(president.id)
    this.hooks.onSelect?.(this.selectedId)
    this.hooks.onYearLabel?.(president.yearsLabel)
    this.setPhase('selected')
    this.transitionBannerUntil = performance.now() + 1200
    void audio.play('ui')
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
    this.world.setFocus(null, this.hoveredId, this.camera)
    this.applyExploreFraming()
    this.hooks.onSelect?.(null)
    this.setPhase('explore')
    this.controls.enabled = true
  }

  getSelectedId(): string | null {
    return this.selectedId
  }

  isShowingTransitionBanner(): boolean {
    return performance.now() < this.transitionBannerUntil
  }

  private applyExploreFraming(): void {
    const cardsHeight = this.world.floatingCardAltitude
    const distance = this.fit.cameraDistance
    this.cameraTarget.set(0, cardsHeight + this.fit.cameraHeight, distance)
    this.lookTarget.set(0, cardsHeight + this.fit.lookHeight, 0)
    this.desiredCam.copy(this.cameraTarget)
    this.desiredLook.copy(this.lookTarget)
  }

  private tick = (): void => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.tick)
    const delta = Math.min(0.05, this.clock.getDelta())
    const time = this.clock.elapsedTime
    this.phaseTime += delta

    this.updateIntro(delta)
    this.world.update(time, delta)

    const manualNavigation = this.phase === 'explore' && this.hasUserNavigated
    if (this.selectedId) {
      holdSelectCamera(
        this.camera,
        this.desiredCam,
        this.lookTarget,
        this.desiredLook,
        this.controls.target,
      )
    } else if (!manualNavigation) {
      this.camera.position.lerp(this.desiredCam, 1 - Math.exp(-delta * 2.2))
      this.lookTarget.lerp(this.desiredLook, 1 - Math.exp(-delta * 2.4))
      this.controls.target.copy(this.lookTarget)
    }

    if (this.phase === 'explore' && !this.selectedId) {
      if (!this.hasUserNavigated) {
        this.idleOrbit += delta * 0.12
        const distance = this.fit.cameraDistance
        this.desiredCam.set(
          Math.sin(this.idleOrbit) * distance,
          this.world.floatingCardAltitude +
            this.fit.cameraHeight +
            Math.sin(this.idleOrbit * 0.5) * 0.15,
          Math.cos(this.idleOrbit) * distance,
        )
      }
    }

    if (!this.selectedId) {
      if (this.controls.enabled) this.controls.update()
      else this.camera.lookAt(this.lookTarget)
    }

    this.renderer.render(this.scene, this.camera)
  }

  private updateIntro(_delta: number): void {
    if (this.phase === 'titles') {
      if (this.phaseTime > 1.6) {
        this.setPhase('lights')
      }
      return
    }

    if (this.phase === 'lights') {
      const t = Math.min(0.4, this.phaseTime / 2.0)
      this.world.setIntroProgress(t)
      this.desiredCam.set(
        0,
        this.world.floatingCardAltitude + this.fit.cameraHeight + 0.4,
        this.fit.cameraDistance + 1,
      )
      if (this.phaseTime > 2.0) this.setPhase('reveal')
      return
    }

    if (this.phase === 'reveal') {
      const t = Math.min(1, 0.4 + (this.phaseTime / 3.2) * 0.6)
      this.world.setIntroProgress(t)
      if (t >= 1) this.setPhase('tagline')
      return
    }

    if (this.phase === 'tagline' && this.phaseTime > 2.2) {
      this.setPhase('explore')
      this.controls.enabled = true
    }
  }

  private setPhase(phase: PresidentsPhase): void {
    this.phase = phase
    this.phaseTime = 0
    this.hooks.onPhase?.(phase)
  }

  private handlePointer(e: PointerEvent, isDown: boolean): void {
    if (this.phase !== 'explore' && this.phase !== 'selected') return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)

    const meshes = this.world.cards.flatMap((c) => [c.meshFront, c.meshBack])
    const hits = this.raycaster.intersectObjects(meshes, false)
    const id = hits[0]?.object.userData.presidentId as string | undefined

    if (!isDown) {
      if (id !== this.hoveredId) {
        this.hoveredId = id ?? null
        this.world.setFocus(this.selectedId, this.hoveredId, this.camera)
        this.hooks.onHover?.(this.hoveredId)
      }
      return
    }

    if (!id) {
      if (this.selectedId) this.clearSelection()
      return
    }

    if (this.selectedId === id) {
      this.world.getCardById(id)?.toggleFlip()
      void audio.play('ui')
      return
    }

    const index = getPresidentIndex(id)
    this.selectByIndex(index)
  }

  private focusCameraOn(id: string): void {
    const card = this.world.getCardById(id)
    if (!card) return
    const parent = card.group.parent
    const home = card.anim.basePosition.clone()
    if (parent) parent.localToWorld(home)
    else home.copy(card.anim.basePosition)

    const { cam, look } = computeStableCardFraming(home, this.fit)
    this.desiredLook.copy(look)
    this.desiredCam.copy(cam)
    this.controls.enabled = false
    holdSelectCamera(
      this.camera,
      this.desiredCam,
      this.lookTarget,
      this.desiredLook,
      this.controls.target,
    )
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
    if (!this.selectedId) this.applyExploreFraming()
  }
}
