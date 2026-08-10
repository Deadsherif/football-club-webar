import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LegendsContent } from '@/ar/legends/LegendsContent'
import { StadiumEnvironment } from '@/ar/stadium/StadiumEnvironment'
import { getLegendPlayer, type LegendPlayer } from '@/data/players'
import {
  getHistoricalSquad,
  historicalSquads,
  type HistoricalSquad,
} from '@/data/squads'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import {
  getStadiumViewportFit,
  type StadiumViewportFit,
} from '@/utils/stadiumViewport'
import { audio } from '@/services/audioService'
import { attachStudioEnvironment } from '@/ar/effects/studioEnvironment'
import {
  computeStableCardFraming,
  holdSelectCamera,
} from '@/ar/engine/stableSelectCamera'

export interface LegendsControllerHooks {
  onSelect?: (player: LegendPlayer | null) => void
  onSquadChange?: (squad: HistoricalSquad) => void
}

/** Free-WebGL fallback counterpart to the AR Legends content mode. */
export class LegendsController {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly controls: OrbitControls
  private readonly environment = new StadiumEnvironment()
  private readonly content: LegendsContent
  private readonly clock = new THREE.Clock()
  private readonly pointer = new THREE.Vector2()
  private readonly container: HTMLElement
  private readonly onResize: () => void
  private readonly onPointerUp: (event: PointerEvent) => void
  private hooks: LegendsControllerHooks = {}
  private fit: StadiumViewportFit
  private currentSquadIndex = 0
  private selectedId: string | null = null
  private running = false
  private frame = 0
  private target = new THREE.Vector3()
  private desiredCamera = new THREE.Vector3()
  private disposeEnvironment: (() => void) | null = null
  private hasUserNavigated = false

  constructor(container: HTMLElement) {
    this.container = container
    const capability = detectDeviceCapability()
    this.fit = getStadiumViewportFit(container.clientWidth, container.clientHeight)
    this.content = new LegendsContent(this.fit.formationScale * this.fit.cardScale)
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
    this.scene.fog = new THREE.FogExp2(0x080305, 0.04)
    this.scene.add(this.environment.root)
    this.environment.contentRoot.add(this.content.root)
    this.disposeEnvironment = attachStudioEnvironment(this.renderer, this.scene, 1)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.minDistance = this.fit.minDistance
    this.controls.maxDistance = this.fit.maxDistance
    this.controls.maxPolarAngle = Math.PI * 0.48
    this.controls.minPolarAngle = Math.PI * 0.16
    this.controls.addEventListener('start', () => {
      this.hasUserNavigated = true
    })

    this.content.setHooks({
      onTransitionPhase: (phase) => {
        this.environment.setLightIntensity(
          phase === 'dissolve' || phase === 'title' ? 0.14 : 0.45,
        )
      },
    })

    this.onResize = () => this.resize()
    this.onPointerUp = (event) => this.pick(event)
  }

  setHooks(hooks: LegendsControllerHooks): void {
    this.hooks = hooks
  }

  async start(): Promise<void> {
    await this.environment.setup({ targetWidth: 7.4 })
    this.content.setCamera(this.camera)
    this.resetCamera()
    this.camera.position.copy(this.desiredCamera)
    this.controls.target.copy(this.target)
    this.environment.setLightIntensity(0.45)
    this.selectSquad(historicalSquads[0].id)

    this.running = true
    window.addEventListener('resize', this.onResize)
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp)
    this.clock.start()
    this.tick()
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.frame)
    window.removeEventListener('resize', this.onResize)
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp)
    this.content.dispose()
    this.environment.dispose()
    this.controls.dispose()
    this.disposeEnvironment?.()
    this.disposeEnvironment = null
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  selectSquad(squadId: string): void {
    const squad = getHistoricalSquad(squadId)
    if (!squad) return
    this.currentSquadIndex = historicalSquads.findIndex((item) => item.id === squad.id)
    this.selectedId = null
    this.content.setFocus(null, null)
    this.content.setSquad(squad)
    this.hooks.onSelect?.(null)
    this.hooks.onSquadChange?.(squad)
    void audio.play('ui')
  }

  nextSquad(): void {
    this.selectSquad(
      historicalSquads[(this.currentSquadIndex + 1) % historicalSquads.length].id,
    )
  }

  previousSquad(): void {
    this.selectSquad(
      historicalSquads[
        (this.currentSquadIndex - 1 + historicalSquads.length) %
          historicalSquads.length
      ].id,
    )
  }

  selectPlayer(playerId: string | null): void {
    this.selectedId = playerId
    this.content.setFocus(playerId, null)
    const player = playerId ? getLegendPlayer(playerId) ?? null : null
    if (player && playerId) this.focusCard(playerId)
    else {
      this.hasUserNavigated = false
      this.controls.enabled = true
      this.resetCamera()
    }
    this.hooks.onSelect?.(player)
  }

  nextPlayer(): void {
    const cards = this.content.cards
    if (cards.length === 0) return
    const index = Math.max(0, cards.findIndex((card) => card.player.id === this.selectedId))
    this.selectPlayer(cards[(index + 1) % cards.length].player.id)
  }

  previousPlayer(): void {
    const cards = this.content.cards
    if (cards.length === 0) return
    const index = Math.max(0, cards.findIndex((card) => card.player.id === this.selectedId))
    this.selectPlayer(cards[(index - 1 + cards.length) % cards.length].player.id)
  }

  toggleSelectedPlayerCard(): void {
    this.content.toggleSelectedCard()
  }

  private tick = (): void => {
    if (!this.running) return
    this.frame = requestAnimationFrame(this.tick)
    const delta = Math.min(0.05, this.clock.getDelta())
    const time = this.clock.elapsedTime
    this.environment.update(time, delta)
    this.content.update(time, delta)
    if (this.selectedId) {
      holdSelectCamera(
        this.camera,
        this.desiredCamera,
        this.target,
        this.target,
        this.controls.target,
      )
    } else if (!this.hasUserNavigated) {
      this.camera.position.lerp(this.desiredCamera, 1 - Math.exp(-delta * 2.5))
      this.controls.target.lerp(this.target, 1 - Math.exp(-delta * 2.5))
      this.controls.update()
    } else {
      this.controls.update()
    }
    this.renderer.render(this.scene, this.camera)
  }

  private pick(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    const id = this.content.pick(this.pointer, this.camera)
    if (!id) {
      this.selectPlayer(null)
      return
    }
    if (id === this.selectedId) {
      this.toggleSelectedPlayerCard()
      return
    }
    this.selectPlayer(id)
  }

  private focusCard(id: string): void {
    const card = this.content.getCard(id)
    if (!card) return
    const parent = card.group.parent
    const home = card.anim.basePosition.clone()
    if (parent) parent.localToWorld(home)
    else home.copy(card.anim.basePosition)

    const { cam, look } = computeStableCardFraming(home, this.fit)
    this.target.copy(look)
    this.desiredCamera.copy(cam)
    this.controls.enabled = false
    holdSelectCamera(
      this.camera,
      this.desiredCamera,
      this.target,
      this.target,
      this.controls.target,
    )
  }

  private resetCamera(): void {
    const height = this.environment.floatingCardAltitude
    this.target.set(0, height + this.fit.lookHeight, 0)
    this.desiredCamera.set(
      0,
      height + this.fit.cameraHeight,
      this.fit.cameraDistance,
    )
  }

  private resize(): void {
    const width = this.container.clientWidth
    const height = Math.max(1, this.container.clientHeight)
    this.fit = getStadiumViewportFit(width, height)
    this.camera.fov = this.fit.fov
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.controls.minDistance = this.fit.minDistance
    this.controls.maxDistance = this.fit.maxDistance
    this.renderer.setSize(width, height)
    if (!this.selectedId) this.resetCamera()
  }
}
