import * as THREE from 'three'
import { BaseARScene, type ARSceneContext } from '@/ar/scenes/BaseARScene'
import { CLUB_CREST_SCENE } from '@/config/scenes'
import type { ProgressCallback } from '@/ar/assets/AssetLoader'
import { CrestGlow } from '@/ar/effects'
import { StadiumEnvironment } from '@/ar/stadium/StadiumEnvironment'
import { StabilizedAnchor } from '@/ar/engine/StabilizedAnchor'
import { LegendsContent } from '@/ar/legends/LegendsContent'
import { PresidentsContent } from '@/ar/presidents/PresidentsContent'
import { BoardContent } from '@/ar/board/BoardContent'
import { RedCastleContent } from '@/ar/red-castle/RedCastleContent'
import { TrophiesContent } from '@/ar/trophies/TrophiesContent'
import type { RosterContent } from '@/ar/roster/RosterContent'
import { getLegendPlayer, type LegendPlayer } from '@/data/players'
import { getPresidentById, type President } from '@/data/presidents'
import {
  getBoardMemberById,
  type BoardMemberCard,
} from '@/data/boardMembers'
import {
  getRedCastleMemberById,
  type RedCastleMember,
} from '@/data/redCastleMembers'
import {
  getTrophyById,
  type TrophyDefinition,
} from '@/data/trophies'
import {
  getHistoricalSquad,
  historicalSquads,
} from '@/data/squads'
import { analytics } from '@/services/analyticsService'

export type ClubContentMode =
  | 'stadium'
  | 'legends'
  | 'presidents'
  | 'board'
  | 'red-castle'
  | 'trophies'

/**
 * Crest scan shows a stabilized Al Ahly stadium on the physical crest,
 * with flying cards and zoom-on-select inside AR.
 */
export class ClubCrestScene extends BaseARScene {
  readonly id = CLUB_CREST_SCENE.id

  private stabilizer: StabilizedAnchor | null = null
  private environment = new StadiumEnvironment()
  private legends: LegendsContent
  private presidents: PresidentsContent
  private board: BoardContent
  private redCastle: RedCastleContent
  private trophiesCabinet: TrophiesContent
  private glow = new CrestGlow()
  private targetVisible = false
  private detectedOnce = false
  private experienceReady = false
  private contentMode: ClubContentMode = 'stadium'
  private onLegendPlayerSelected?: (player: LegendPlayer | null) => void
  private onPresidentSelected?: (president: President | null) => void
  private onBoardMemberSelected?: (member: BoardMemberCard | null) => void
  private onRedCastleMemberSelected?: (member: RedCastleMember | null) => void
  private onTrophySelected?: (trophy: TrophyDefinition | null) => void
  private onContentModeChanged?: (mode: ClubContentMode) => void
  private readonly onProgress?: ProgressCallback

  constructor(onProgress?: ProgressCallback) {
    super()
    this.onProgress = onProgress
    this.legends = new LegendsContent(0.28)
    this.presidents = new PresidentsContent(0.28)
    this.board = new BoardContent(0.28)
    this.redCastle = new RedCastleContent(0.28)
    this.trophiesCabinet = new TrophiesContent(0.28)
    this.legends.setHooks({
      onTransitionPhase: (phase) => {
        this.environment.setLightIntensity(
          phase === 'dissolve' || phase === 'title' ? 0.14 : 0.45,
        )
      },
    })
  }

  async setup(ctx: ARSceneContext): Promise<void> {
    this.ctx = ctx

    this.stabilizer = new StabilizedAnchor(ctx.anchorGroup, {
      baseAlpha: 0.2,
      settledAlpha: 0.07,
    })
    ctx.scene.add(this.stabilizer.root)

    this.stabilizer.root.add(this.glow.group)
    this.stabilizer.root.add(this.environment.root)
    this.environment.contentRoot.add(this.legends.root)
    this.environment.contentRoot.add(this.presidents.root)
    this.environment.contentRoot.add(this.board.root)
    this.environment.contentRoot.add(this.redCastle.root)
    this.environment.contentRoot.add(this.trophiesCabinet.root)
    this.legends.root.visible = false
    this.presidents.root.visible = false
    this.board.root.visible = false
    this.redCastle.root.visible = false
    this.trophiesCabinet.root.visible = false
    this.presidents.setCamera(ctx.camera)
    this.board.setCamera(ctx.camera)
    this.redCastle.setCamera(ctx.camera)
    this.trophiesCabinet.setCamera(ctx.camera)
    this.legends.setCamera(ctx.camera)
    this.stabilizer.root.visible = false

    void this.loadStadium()
  }

  override onTargetFound(): void {
    super.onTargetFound()
    this.targetVisible = true
    this.stabilizer?.setTracking(true)
    this.stabilizer?.snap()
    if (this.stabilizer) this.stabilizer.root.visible = true
    this.glow.setActive(true)

    if (!this.detectedOnce) {
      this.detectedOnce = true
      analytics.targetDetected()
    }
    this.showStadiumIfReady()
  }

  override onTargetLost(): void {
    super.onTargetLost()
    this.targetVisible = false
    this.stabilizer?.setTracking(false)
    this.glow.setActive(false)
    this.environment.setStadiumVisible(false)
    if (this.stabilizer) this.stabilizer.root.visible = false
    if (!this.experienceReady) {
      this.emitCinematicPhase('idle')
    }
  }

  override update(deltaSeconds: number): void {
    this.stabilizer?.update()
    if (!this.stabilizer?.root.visible) return

    this.glow.setScriptedIntensity(
      this.trackingState === 'tracking' ? 0.85 : 0.25,
    )
    this.glow.update(deltaSeconds)

    if (!this.environment.stadiumRoot.visible) return

    const camera = this.ctx?.camera ?? null
    this.presidents.setCamera(camera)
    this.board.setCamera(camera)
    this.redCastle.setCamera(camera)
    this.trophiesCabinet.setCamera(camera)
    this.legends.setCamera(camera)

    const time = performance.now() / 1000
    if (this.contentMode === 'legends') {
      this.legends.update(time, deltaSeconds)
    } else if (this.contentMode === 'presidents') {
      this.presidents.update(time, deltaSeconds)
    } else if (this.contentMode === 'board') {
      this.board.update(time, deltaSeconds)
    } else if (this.contentMode === 'red-castle') {
      this.redCastle.update(time, deltaSeconds)
    } else if (this.contentMode === 'trophies') {
      this.trophiesCabinet.update(time, deltaSeconds)
    }
    this.environment.update(time, deltaSeconds)
  }

  override dispose(): void {
    this.glow.dispose()
    this.legends.dispose()
    this.presidents.dispose()
    this.board.dispose()
    this.redCastle.dispose()
    this.trophiesCabinet.dispose()
    this.environment.dispose()
    this.stabilizer?.root.removeFromParent()
    this.stabilizer = null
    super.dispose()
  }

  private async loadStadium(): Promise<void> {
    try {
      await this.environment.setup({
        targetWidth: 1.05,
        onProgress: this.onProgress,
      })
      if (this.disposed) return
      this.showStadiumIfReady()
    } catch {
      this.onProgress?.({ loaded: 1, total: 1, url: 'stadium-failed', ratio: 1 })
    }
  }

  private showStadiumIfReady(): void {
    if (!this.environment.isReady || !this.targetVisible) return

    this.environment.setStadiumVisible(true)
    this.environment.stadiumRoot.scale.setScalar(1)
    this.environment.stadiumRoot.position.y = 0
    this.environment.stadiumRoot.rotation.set(0, 0, 0)
    this.environment.setLightIntensity(0.45)

    const fit = this.environment.arContentFit
    if (fit) {
      this.legends.applyStadiumFit(fit)
      this.presidents.applyStadiumFit(fit)
      this.board.applyStadiumFit(fit)
      this.redCastle.applyStadiumFit(fit)
      this.trophiesCabinet.applyStadiumFit(fit)
    }

    if (!this.experienceReady) {
      this.experienceReady = true
      analytics.stadiumLoaded()
      analytics.experienceCompleted()
      // Cards fly over the crest stadium as soon as tracking unlocks.
      this.setContentMode('presidents')
    }
    this.emitCinematicPhase('complete')
  }

  private deactivateCardModes(): void {
    this.presidents.deactivate()
    this.board.deactivate()
    this.redCastle.deactivate()
    this.trophiesCabinet.deactivate()
    this.legends.root.visible = false
  }

  setContentMode(mode: ClubContentMode): void {
    this.contentMode = mode
    this.environment.stadiumRoot.rotation.set(0, 0, 0)

    if (mode === 'legends') {
      this.presidents.deactivate()
      this.board.deactivate()
      this.redCastle.deactivate()
      this.trophiesCabinet.deactivate()
      this.legends.root.visible = true
      if (!this.legends.activeSquad) {
        this.setLegendSquad(historicalSquads[0].id)
      }
      this.onContentModeChanged?.(mode)
      return
    }

    this.legends.root.visible = false

    if (mode === 'presidents') {
      this.board.deactivate()
      this.redCastle.deactivate()
      this.trophiesCabinet.deactivate()
      this.presidents.activate()
      analytics.sectionOpened('presidents')
      this.onContentModeChanged?.(mode)
      return
    }

    if (mode === 'board') {
      this.presidents.deactivate()
      this.redCastle.deactivate()
      this.trophiesCabinet.deactivate()
      this.board.activate()
      analytics.sectionOpened('board')
      this.onContentModeChanged?.(mode)
      return
    }

    if (mode === 'red-castle') {
      this.presidents.deactivate()
      this.board.deactivate()
      this.trophiesCabinet.deactivate()
      this.redCastle.activate()
      analytics.sectionOpened('red-castle')
      this.onContentModeChanged?.(mode)
      return
    }

    if (mode === 'trophies') {
      this.presidents.deactivate()
      this.board.deactivate()
      this.redCastle.deactivate()
      this.trophiesCabinet.activate()
      analytics.sectionOpened('trophies')
      analytics.trophiesOpened()
      this.onContentModeChanged?.(mode)
      return
    }

    this.deactivateCardModes()
    this.onContentModeChanged?.(mode)
  }

  setContentModeHandler(handler: (mode: ClubContentMode) => void): void {
    this.onContentModeChanged = handler
  }

  setLegendSquad(squadId: string): void {
    const squad = getHistoricalSquad(squadId)
    if (!squad) return
    this.contentMode = 'legends'
    this.presidents.deactivate()
    this.board.deactivate()
    this.redCastle.deactivate()
    this.trophiesCabinet.deactivate()
    this.legends.root.visible = true
    this.legends.setSquad(squad)
    this.onContentModeChanged?.('legends')
  }

  setLegendSelectionHandler(
    handler: (player: LegendPlayer | null) => void,
  ): void {
    this.onLegendPlayerSelected = handler
  }

  setPresidentSelectionHandler(
    handler: (president: President | null) => void,
  ): void {
    this.onPresidentSelected = handler
  }

  setBoardSelectionHandler(
    handler: (member: BoardMemberCard | null) => void,
  ): void {
    this.onBoardMemberSelected = handler
  }

  setRedCastleSelectionHandler(
    handler: (member: RedCastleMember | null) => void,
  ): void {
    this.onRedCastleMemberSelected = handler
  }

  setTrophySelectionHandler(
    handler: (trophy: TrophyDefinition | null) => void,
  ): void {
    this.onTrophySelected = handler
  }

  selectLegendPlayer(playerId: string | null): void {
    this.legends.setFocus(playerId, null)
    this.onLegendPlayerSelected?.(
      playerId ? getLegendPlayer(playerId) ?? null : null,
    )
  }

  selectPresident(presidentId: string | null): void {
    this.presidents.setFocus(presidentId, null)
    this.onPresidentSelected?.(
      presidentId ? getPresidentById(presidentId) ?? null : null,
    )
  }

  selectBoardMember(memberId: string | null): void {
    this.board.setFocus(memberId, null)
    this.onBoardMemberSelected?.(
      memberId ? getBoardMemberById(memberId) ?? null : null,
    )
  }

  selectRedCastleMember(memberId: string | null): void {
    this.redCastle.setFocus(memberId, null)
    this.onRedCastleMemberSelected?.(
      memberId ? getRedCastleMemberById(memberId) ?? null : null,
    )
  }

  selectTrophy(trophyId: string | null): void {
    this.trophiesCabinet.setFocus(trophyId, null)
    this.onTrophySelected?.(trophyId ? getTrophyById(trophyId) ?? null : null)
  }

  onPointerTap(pointer: THREE.Vector2, camera: THREE.Camera): void {
    if (this.contentMode === 'legends') {
      const playerId = this.legends.pick(pointer, camera)
      if (!playerId) {
        this.selectLegendPlayer(null)
        return
      }
      if (playerId === this.legends.selectedPlayerId) {
        this.legends.toggleSelectedCard()
        return
      }
      this.selectLegendPlayer(playerId)
      return
    }

    if (this.contentMode === 'presidents') {
      this.handleRosterTap(
        this.presidents,
        pointer,
        camera,
        (id) => this.selectPresident(id),
      )
      return
    }

    if (this.contentMode === 'board') {
      this.handleRosterTap(
        this.board,
        pointer,
        camera,
        (id) => this.selectBoardMember(id),
      )
      return
    }

    if (this.contentMode === 'red-castle') {
      this.handleRosterTap(
        this.redCastle,
        pointer,
        camera,
        (id) => this.selectRedCastleMember(id),
      )
      return
    }

    if (this.contentMode === 'trophies') {
      const trophyId = this.trophiesCabinet.pick(pointer, camera)
      if (!trophyId) {
        this.selectTrophy(null)
        return
      }
      if (trophyId === this.trophiesCabinet.selectedTrophyId) return
      this.selectTrophy(trophyId)
    }
  }

  private handleRosterTap(
    roster: RosterContent,
    pointer: THREE.Vector2,
    camera: THREE.Camera,
    select: (id: string | null) => void,
  ): void {
    const id = roster.pick(pointer, camera)
    if (!id) {
      select(null)
      return
    }
    if (id === roster.selectedIdValue) {
      roster.toggleSelectedCard()
      return
    }
    select(id)
  }
}
