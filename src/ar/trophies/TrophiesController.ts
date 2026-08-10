import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrophiesWorld } from '@/ar/trophies/TrophiesWorld'
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
import { assetLoader } from '@/ar/assets/AssetLoader'

export type TrophiesPhase =
  | 'boot'
  | 'titles'
  | 'lights'
  | 'reveal'
  | 'tagline'
  | 'explore'
  | 'selected'

export interface TrophiesControllerHooks {
  onPhase?: (phase: TrophiesPhase) => void
  onHover?: (id: string | null) => void
  onSelect?: (id: string | null) => void
  onLabel?: (label: string) => void
}

/**
 * Free WebGL trophies cabinet — same stadium framing as Presidents,
 * with studio IBL so GLB textures match source files.
 */
export class TrophiesController {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private world = new TrophiesWorld()
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private clock = new THREE.Clock()
  private running = false
  private raf = 0
  private phase: TrophiesPhase = 'boot'
  private phaseTime = 0
  private hoveredId: string | null = null
  private selectedId: string | null = null
  private selectedIndex = -1
  private hooks: TrophiesControllerHooks = {}
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

  setHooks(hooks: TrophiesControllerHooks): void {
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
    // Mobile browsers often keep the GL context + heap until forced loss.
    const gl = this.renderer.getContext()
    const lose = (gl as WebGLRenderingContext & {
      getExtension: (name: string) => { loseContext?: () => void } | null
    }).getExtension('WEBGL_lose_context')
    lose?.loseContext?.()
    this.renderer.domElement.remove()
    assetLoader.clearCache()
  }

  selectByIndex(index: number): void {
    const list = this.world.trophies.map((t) => t.trophy)
    if (list.length === 0) return
    const clamped = (index + list.length) % list.length
    const trophy = list[clamped]
    this.selectedIndex = clamped
    this.selectedId = trophy.id
    this.world.setFocus(this.selectedId, null)
    void this.world.ensureTrophyModel(trophy.id)
    this.focusCameraOn(trophy.id)
    this.hooks.onSelect?.(this.selectedId)
    this.hooks.onLabel?.(trophy.nameAr)
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
    this.world.setFocus(null, this.hoveredId)
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
    const alt = this.world.floatingTrophyAltitude
    const distance = this.fit.cameraDistance
    this.cameraTarget.set(0, alt + this.fit.cameraHeight, distance)
    this.lookTarget.set(0, alt + this.fit.lookHeight, 0)
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
          this.world.floatingTrophyAltitude +
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
      if (this.phaseTime > 1.6) this.setPhase('lights')
      return
    }

    if (this.phase === 'lights') {
      const t = Math.min(0.4, this.phaseTime / 2.0)
      this.world.setIntroProgress(t)
      this.desiredCam.set(
        0,
        this.world.floatingTrophyAltitude + this.fit.cameraHeight + 0.4,
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

  private setPhase(phase: TrophiesPhase): void {
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

    const meshes = this.world.trophies.flatMap((t) => {
      const list: THREE.Object3D[] = [t.hitProxy]
      t.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj !== t.hitProxy) list.push(obj)
      })
      return list
    })
    const hits = this.raycaster.intersectObjects(meshes, false)
    const id = hits[0]?.object.userData.trophyId as string | undefined

    if (!isDown) {
      if (id !== this.hoveredId) {
        this.hoveredId = id ?? null
        this.world.setFocus(this.selectedId, this.hoveredId)
        this.hooks.onHover?.(this.hoveredId)
      }
      return
    }

    if (!id) {
      if (this.selectedId) this.clearSelection()
      return
    }

    if (this.selectedId === id) {
      void audio.play('ui')
      return
    }

    const index = this.world.trophies.findIndex((t) => t.trophy.id === id)
    if (index < 0) return
    this.selectByIndex(index)
  }

  private focusCameraOn(id: string): void {
    const obj = this.world.getTrophyById(id)
    if (!obj) return
    obj.group.updateWorldMatrix(true, false)
    const pos = obj.group.getWorldPosition(new THREE.Vector3())
    const { cam, look } = computeStableCardFraming(pos, this.fit, 0.25)
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
