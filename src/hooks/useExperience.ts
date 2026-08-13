import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  classifyMindARCameraError,
  requestCameraPermission,
} from '@/ar/engine/CameraPermissions'
import { SCENES, DEFAULT_SCENE_ID } from '@/config/scenes'
import type {
  AppPhase,
  AssetLoadProgress,
  CameraErrorKind,
  CinematicPhase,
  ExploreSection,
  TrackingState,
} from '@/types/ar'
import type { MindAREngine } from '@/ar/engine/MindAREngine'
import { detectDeviceCapability } from '@/utils/deviceCapability'
import { analytics } from '@/services/analyticsService'
import { audio } from '@/services/audioService'
import { setLocale } from '@/i18n'
import type { LegendPlayer } from '@/data/players'
import type { President } from '@/data/presidents'
import { presidents as presidentsList } from '@/data/presidents'
import {
  boardMembers,
  type BoardMemberCard,
} from '@/data/boardMembers'
import {
  redCastleMembers,
  type RedCastleMember,
} from '@/data/redCastleMembers'
import {
  trophies as trophiesList,
  type TrophyDefinition,
} from '@/data/trophies'
import { historicalSquads } from '@/data/squads'

interface UseExperienceOptions {
  sceneId?: string
}

const EXPERIENCE_ROUTES = new Set([
  '/presidents',
  '/board',
  '/red-castle',
  '/legends',
  '/trophies',
])

function phaseForPath(path: string, isDesktop: boolean): AppPhase {
  if (path.startsWith('/presidents')) return 'presidents'
  if (path.startsWith('/board')) return 'board'
  if (path.startsWith('/red-castle')) return 'red-castle'
  if (path.startsWith('/legends')) return 'legends'
  if (path.startsWith('/trophies')) return 'trophies'
  if (path.startsWith('/menu') || path.startsWith('/explore')) return 'fallback'
  if (path.startsWith('/ar')) return 'ar'
  if (path.startsWith('/camera-error')) return 'camera-error'
  if (path.startsWith('/unsupported')) return 'unsupported'
  return isDesktop ? 'desktop' : 'landing'
}

/** Prefer a safe in-app screen when the prior route can't be restored cleanly. */
function resolveReturnPath(path: string): string {
  if (
    !path ||
    path === '/ar' ||
    path.startsWith('/camera-error') ||
    path.startsWith('/unsupported') ||
    EXPERIENCE_ROUTES.has(path)
  ) {
    return '/menu'
  }
  return path
}

async function waitForElement(
  ref: { current: HTMLDivElement | null },
  attempts = 60,
): Promise<HTMLDivElement | null> {
  for (let i = 0; i < attempts; i += 1) {
    if (ref.current) return ref.current
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
  return ref.current
}

export function useExperience(options: UseExperienceOptions = {}) {
  const sceneId = options.sceneId ?? DEFAULT_SCENE_ID
  const navigate = useNavigate()
  const location = useLocation()
  const capability = useMemo(() => detectDeviceCapability(), [])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<MindAREngine | null>(null)
  /** Where Back should return from standalone experience routes. */
  const returnPathRef = useRef('/menu')

  const [phase, setPhase] = useState<AppPhase>(() =>
    capability.isDesktop ? 'desktop' : 'landing',
  )
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadLabel, setLoadLabel] = useState('')
  const [trackingState, setTrackingState] = useState<TrackingState>('searching')
  const [cinematicPhase, setCinematicPhase] = useState<CinematicPhase>('idle')
  const [exploreSection, setExploreSection] = useState<ExploreSection>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [cameraError, setCameraError] = useState<CameraErrorKind | null>(null)
  const [legendsOpen, setLegendsOpen] = useState(false)
  const [presidentsOpen, setPresidentsOpen] = useState(false)
  const [boardOpen, setBoardOpen] = useState(false)
  const [redCastleOpen, setRedCastleOpen] = useState(false)
  const [trophiesOpen, setTrophiesOpen] = useState(false)
  const [selectedPresident, setSelectedPresident] = useState<President | null>(
    null,
  )
  const [selectedBoardMember, setSelectedBoardMember] =
    useState<BoardMemberCard | null>(null)
  const [selectedRedCastleMember, setSelectedRedCastleMember] =
    useState<RedCastleMember | null>(null)
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyDefinition | null>(
    null,
  )
  const [legendSquadId, setLegendSquadId] = useState(historicalSquads[0].id)
  const [selectedLegend, setSelectedLegend] = useState<LegendPlayer | null>(null)

  useEffect(() => {
    setLocale('en')
    if (!capability.hasWebGL && !capability.isDesktop) {
      setPhase('unsupported')
      navigate('/unsupported', { replace: true })
    }
  }, [capability.hasWebGL, capability.isDesktop, navigate])

  const stopAR = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    audio.stopAll()
    setTrackingState('searching')
    setCinematicPhase('idle')
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setBoardOpen(false)
    setRedCastleOpen(false)
    setTrophiesOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)
  }, [])

  const goLanding = useCallback(() => {
    stopAR()
    setCameraError(null)
    setLoadProgress(0)
    setPhase(capability.isDesktop ? 'desktop' : 'landing')
    navigate('/')
  }, [capability.isDesktop, navigate, stopAR])

  const openFallback = useCallback(() => {
    stopAR()
    setPhase('fallback')
    navigate('/menu')
  }, [navigate, stopAR])

  const openExplore = useCallback(
    (section: ExploreSection) => {
      setExploreSection(section)
      if (phase === 'ar' || phase === 'loading') return
      if (!section) {
        setPhase('fallback')
        navigate('/menu')
        return
      }
      setPhase('fallback')
      navigate(`/explore/${section}`)
    },
    [navigate, phase],
  )

  const closeExplore = useCallback(() => {
    setExploreSection(null)
    if (phase === 'ar' || phase === 'loading') return
    setPhase('fallback')
    navigate('/menu')
  }, [navigate, phase])

  const captureReturnPath = useCallback(() => {
    const path = location.pathname
    if (!EXPERIENCE_ROUTES.has(path)) {
      returnPathRef.current = path || '/'
    }
  }, [location.pathname])

  const backFromExperience = useCallback(() => {
    setPresidentsOpen(false)
    setBoardOpen(false)
    setRedCastleOpen(false)
    setTrophiesOpen(false)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)
    setSelectedLegend(null)
    setLegendsOpen(false)
    setExploreSection(null)
    const returnPath = resolveReturnPath(returnPathRef.current)
    setPhase(phaseForPath(returnPath, capability.isDesktop))
    navigate(returnPath)
  }, [capability.isDesktop, navigate])

  const preparePresidents = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    audio.stopAll()
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setTrackingState('searching')
    setCinematicPhase('idle')
    setPhase('presidents')
  }, [])

  const backFromPresidents = backFromExperience

  const openPresidents = useCallback(() => {
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setBoardOpen(false)
    setRedCastleOpen(false)
    setTrophiesOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)

    if (phase === 'ar' && engineRef.current) {
      engineRef.current.setContentMode('presidents')
      setPresidentsOpen(true)
      return
    }

    captureReturnPath()
    navigate('/presidents')
    preparePresidents()
  }, [captureReturnPath, navigate, phase, preparePresidents])

  const prepareBoard = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    audio.stopAll()
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setBoardOpen(false)
    setRedCastleOpen(false)
    setTrophiesOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)
    setTrackingState('searching')
    setCinematicPhase('idle')
    setPhase('board')
  }, [])

  const backFromBoard = backFromExperience

  const openBoard = useCallback(() => {
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setRedCastleOpen(false)
    setTrophiesOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)

    if (phase === 'ar' && engineRef.current) {
      engineRef.current.setContentMode('board')
      setBoardOpen(true)
      return
    }

    captureReturnPath()
    navigate('/board')
    prepareBoard()
  }, [captureReturnPath, navigate, phase, prepareBoard])

  const prepareRedCastle = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    audio.stopAll()
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setBoardOpen(false)
    setRedCastleOpen(false)
    setTrophiesOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)
    setTrackingState('searching')
    setCinematicPhase('idle')
    setPhase('red-castle')
  }, [])

  const backFromRedCastle = backFromExperience

  const openRedCastle = useCallback(() => {
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setBoardOpen(false)
    setTrophiesOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)

    if (phase === 'ar' && engineRef.current) {
      engineRef.current.setContentMode('red-castle')
      setRedCastleOpen(true)
      return
    }

    captureReturnPath()
    navigate('/red-castle')
    prepareRedCastle()
  }, [captureReturnPath, navigate, phase, prepareRedCastle])

  const closePresidentsAr = useCallback(() => {
    setSelectedPresident(null)
    engineRef.current?.selectPresident(null)
    engineRef.current?.setContentMode('stadium')
    setPresidentsOpen(false)
  }, [])

  const closeBoardAr = useCallback(() => {
    setSelectedBoardMember(null)
    engineRef.current?.selectBoardMember(null)
    engineRef.current?.setContentMode('stadium')
    setBoardOpen(false)
  }, [])

  const closeRedCastleAr = useCallback(() => {
    setSelectedRedCastleMember(null)
    engineRef.current?.selectRedCastleMember(null)
    engineRef.current?.setContentMode('stadium')
    setRedCastleOpen(false)
  }, [])

  const selectArPresident = useCallback((presidentId: string | null) => {
    engineRef.current?.selectPresident(presidentId)
  }, [])

  const selectArBoardMember = useCallback((memberId: string | null) => {
    engineRef.current?.selectBoardMember(memberId)
  }, [])

  const selectArRedCastleMember = useCallback((memberId: string | null) => {
    engineRef.current?.selectRedCastleMember(memberId)
  }, [])

  const cycleArPresident = useCallback(
    (direction: 1 | -1) => {
      if (presidentsList.length === 0) return
      const current = selectedPresident
        ? presidentsList.findIndex((item) => item.id === selectedPresident.id)
        : -1
      const next =
        (current + direction + presidentsList.length) % presidentsList.length
      engineRef.current?.selectPresident(presidentsList[next].id)
    },
    [selectedPresident],
  )

  const cycleArBoardMember = useCallback(
    (direction: 1 | -1) => {
      if (boardMembers.length === 0) return
      const current = selectedBoardMember
        ? boardMembers.findIndex((item) => item.id === selectedBoardMember.id)
        : -1
      const next =
        (current + direction + boardMembers.length) % boardMembers.length
      engineRef.current?.selectBoardMember(boardMembers[next].id)
    },
    [selectedBoardMember],
  )

  const cycleArRedCastleMember = useCallback(
    (direction: 1 | -1) => {
      if (redCastleMembers.length === 0) return
      const current = selectedRedCastleMember
        ? redCastleMembers.findIndex(
            (item) => item.id === selectedRedCastleMember.id,
          )
        : -1
      const next =
        (current + direction + redCastleMembers.length) %
        redCastleMembers.length
      engineRef.current?.selectRedCastleMember(redCastleMembers[next].id)
    },
    [selectedRedCastleMember],
  )

  const prepareStandaloneLegends = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    audio.stopAll()
    setExploreSection(null)
    setAiOpen(false)
    setSelectedLegend(null)
    setLegendsOpen(false)
    setLegendSquadId(historicalSquads[0].id)
    setTrackingState('searching')
    setCinematicPhase('idle')
    setPhase('legends')
  }, [])

  const openLegends = useCallback(() => {
    setExploreSection(null)
    setAiOpen(false)
    setSelectedLegend(null)
    setLegendSquadId(historicalSquads[0].id)
    analytics.legendsOpened()

    if (phase === 'ar' && engineRef.current) {
      engineRef.current.setContentMode('legends')
      engineRef.current.setLegendSquad(historicalSquads[0].id)
      setPresidentsOpen(false)
      setBoardOpen(false)
      setRedCastleOpen(false)
      setTrophiesOpen(false)
      setSelectedPresident(null)
      setSelectedBoardMember(null)
      setSelectedRedCastleMember(null)
      setSelectedTrophy(null)
      setLegendsOpen(true)
      return
    }

    captureReturnPath()
    navigate('/legends')
    prepareStandaloneLegends()
  }, [captureReturnPath, navigate, phase, prepareStandaloneLegends])

  const closeLegends = useCallback(() => {
    setSelectedLegend(null)
    if (phase === 'ar' || legendsOpen) {
      engineRef.current?.selectLegendPlayer(null)
      engineRef.current?.setContentMode('stadium')
      setLegendsOpen(false)
      return
    }
    backFromExperience()
  }, [backFromExperience, legendsOpen, phase])

  const selectLegendSquad = useCallback((squadId: string) => {
    setLegendSquadId(squadId)
    setSelectedLegend(null)
    engineRef.current?.setLegendSquad(squadId)
    if (squadId === 'all-time-legends') analytics.allTimeLegendsOpened()
    else analytics.legendEraSelected(squadId)
  }, [])

  const selectLegendPlayer = useCallback((playerId: string | null) => {
    engineRef.current?.selectLegendPlayer(playerId)
    if (playerId) analytics.legendPlayerSelected(playerId)
  }, [])

  const prepareTrophies = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    audio.stopAll()
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setBoardOpen(false)
    setRedCastleOpen(false)
    setTrophiesOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)
    setTrackingState('searching')
    setCinematicPhase('idle')
    setPhase('trophies')
  }, [])

  const openTrophies = useCallback(() => {
    setExploreSection(null)
    setAiOpen(false)
    setLegendsOpen(false)
    setPresidentsOpen(false)
    setBoardOpen(false)
    setRedCastleOpen(false)
    setSelectedLegend(null)
    setSelectedPresident(null)
    setSelectedBoardMember(null)
    setSelectedRedCastleMember(null)
    setSelectedTrophy(null)

    if (phase === 'ar' && engineRef.current) {
      engineRef.current.setContentMode('trophies')
      setTrophiesOpen(true)
      return
    }

    captureReturnPath()
    navigate('/trophies')
    prepareTrophies()
  }, [captureReturnPath, navigate, phase, prepareTrophies])

  const closeTrophiesAr = useCallback(() => {
    setSelectedTrophy(null)
    engineRef.current?.selectTrophy(null)
    engineRef.current?.setContentMode('stadium')
    setTrophiesOpen(false)
  }, [])

  const selectArTrophy = useCallback((trophyId: string | null) => {
    engineRef.current?.selectTrophy(trophyId)
  }, [])

  const cycleArTrophy = useCallback(
    (direction: 1 | -1) => {
      if (trophiesList.length === 0) return
      const current = selectedTrophy
        ? trophiesList.findIndex((item) => item.id === selectedTrophy.id)
        : -1
      const next =
        (current + direction + trophiesList.length) % trophiesList.length
      engineRef.current?.selectTrophy(trophiesList[next].id)
    },
    [selectedTrophy],
  )

  const backFromTrophies = backFromExperience

  const startAR = useCallback(async () => {
    if (!capability.hasGetUserMedia || !capability.hasWebGL) {
      setPhase('unsupported')
      navigate('/unsupported')
      return
    }

    stopAR()
    setCameraError(null)
    setPhase('loading')
    setLoadProgress(0)
    setLoadLabel('camera')
    navigate('/ar')
    analytics.cameraOpened()

    const permission = await requestCameraPermission()
    if (!permission.ok) {
      setCameraError(permission.error ?? 'unknown')
      setPhase('camera-error')
      navigate('/camera-error')
      return
    }

    setLoadLabel('assets')
    const container = await waitForElement(containerRef)
    const sceneDef = SCENES[sceneId]
    if (!container || !sceneDef) {
      setCameraError('unknown')
      setPhase('camera-error')
      navigate('/camera-error')
      return
    }

    try {
      const [{ MindAREngine }, { createScene }] = await Promise.all([
        import('@/ar/engine/MindAREngine'),
        import('@/ar/scenes/SceneRegistry'),
      ])

      const arScene = createScene(sceneId, (progress: AssetLoadProgress) => {
        setLoadProgress(progress.ratio)
      })

      const engine = new MindAREngine({
        container,
        sceneDef,
        arScene,
        onTrackingChange: setTrackingState,
        onCinematicPhase: (phaseName) => {
          setCinematicPhase((prev) =>
            prev === 'complete' && phaseName !== 'complete' ? prev : phaseName,
          )
        },
        onError: (err) => {
          setCameraError(classifyMindARCameraError(err))
          setPhase('camera-error')
          navigate('/camera-error')
        },
      })

      engineRef.current = engine
      engine.setLegendSelectionHandler(setSelectedLegend)
      engine.setPresidentSelectionHandler(setSelectedPresident)
      engine.setBoardSelectionHandler(setSelectedBoardMember)
      engine.setRedCastleSelectionHandler(setSelectedRedCastleMember)
      engine.setTrophySelectionHandler(setSelectedTrophy)
      engine.setContentModeHandler((mode) => {
        setPresidentsOpen(mode === 'presidents')
        setLegendsOpen(mode === 'legends')
        setBoardOpen(mode === 'board')
        setRedCastleOpen(mode === 'red-castle')
        setTrophiesOpen(mode === 'trophies')
        if (mode !== 'presidents') setSelectedPresident(null)
        if (mode !== 'legends') setSelectedLegend(null)
        if (mode !== 'board') setSelectedBoardMember(null)
        if (mode !== 'red-castle') setSelectedRedCastleMember(null)
        if (mode !== 'trophies') setSelectedTrophy(null)
      })
      await engine.start()
      setLoadProgress(1)
      setPhase('ar')
    } catch (err) {
      engineRef.current = null
      setCameraError(classifyMindARCameraError(err))
      setPhase('camera-error')
      navigate('/camera-error')
    }
  }, [
    capability.hasGetUserMedia,
    capability.hasWebGL,
    navigate,
    sceneId,
    stopAR,
  ])

  const startExperience = useCallback(() => {
    void audio.unlock()
    analytics.experienceStarted()
    void startAR()
  }, [startAR])

  // Keep AR container mounted while navigating into /ar mid-start.
  useEffect(() => {
    return () => {
      engineRef.current?.stop()
      engineRef.current = null
      audio.dispose()
    }
  }, [])

  return {
    containerRef,
    phase,
    loadProgress,
    loadLabel,
    trackingState,
    cinematicPhase,
    exploreSection,
    setExploreSection: openExplore as (section: ExploreSection) => void,
    aiOpen,
    setAiOpen,
    legendsOpen,
    presidentsOpen,
    boardOpen,
    redCastleOpen,
    trophiesOpen,
    selectedPresident,
    selectedBoardMember,
    selectedRedCastleMember,
    selectedTrophy,
    legendSquadId,
    selectedLegend,
    cameraError,
    capability,
    sceneDef: SCENES[sceneId],
    startExperience,
    startAR,
    goLanding,
    openFallback,
    openExplore,
    closeExplore,
    openPresidents,
    preparePresidents,
    backFromPresidents,
    openBoard,
    prepareBoard,
    backFromBoard,
    openRedCastle,
    prepareRedCastle,
    backFromRedCastle,
    closePresidentsAr,
    closeBoardAr,
    closeRedCastleAr,
    closeTrophiesAr,
    selectArPresident,
    selectArBoardMember,
    selectArRedCastleMember,
    selectArTrophy,
    cycleArPresident,
    cycleArBoardMember,
    cycleArRedCastleMember,
    cycleArTrophy,
    openLegends,
    prepareStandaloneLegends,
    closeLegends,
    selectLegendSquad,
    selectLegendPlayer,
    openTrophies,
    prepareTrophies,
    backFromTrophies,
    stopAR,
  }
}
