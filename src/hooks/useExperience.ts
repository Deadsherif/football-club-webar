import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

interface UseExperienceOptions {
  sceneId?: string
}

export function useExperience(options: UseExperienceOptions = {}) {
  const sceneId = options.sceneId ?? DEFAULT_SCENE_ID
  const capability = useMemo(() => detectDeviceCapability(), [])
  const containerRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<MindAREngine | null>(null)

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

  useEffect(() => {
    setLocale('en')
    if (!capability.hasWebGL && !capability.isDesktop) {
      setPhase('unsupported')
    }
  }, [capability.hasWebGL, capability.isDesktop])

  const stopAR = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    audio.stopAll()
    setTrackingState('searching')
    setCinematicPhase('idle')
    setExploreSection(null)
    setAiOpen(false)
  }, [])

  const goLanding = useCallback(() => {
    stopAR()
    setCameraError(null)
    setLoadProgress(0)
    setPhase(capability.isDesktop ? 'desktop' : 'landing')
  }, [capability.isDesktop, stopAR])

  const [presidentsReturn, setPresidentsReturn] = useState<AppPhase>('fallback')

  const openFallback = useCallback(() => {
    stopAR()
    setPhase('fallback')
  }, [stopAR])

  const openPresidents = useCallback(() => {
    setPresidentsReturn(phase === 'ar' || phase === 'fallback' ? phase : 'fallback')
    // Free GPU: stop MindAR before mounting the presidents WebGL scene.
    engineRef.current?.stop()
    engineRef.current = null
    setExploreSection(null)
    setAiOpen(false)
    setPhase('presidents')
  }, [phase])

  const backFromPresidents = useCallback(() => {
    if (presidentsReturn === 'ar') {
      // AR session was stopped — return to interactive history fallback.
      setPhase('fallback')
      setExploreSection('history')
      return
    }
    setPhase(presidentsReturn === 'presidents' ? 'fallback' : presidentsReturn)
    setExploreSection('history')
  }, [presidentsReturn])

  const startAR = useCallback(async () => {
    if (!capability.hasGetUserMedia || !capability.hasWebGL) {
      setPhase('unsupported')
      return
    }

    stopAR()
    setCameraError(null)
    setPhase('loading')
    setLoadProgress(0)
    setLoadLabel('camera')
    analytics.cameraOpened()

    const permission = await requestCameraPermission()
    if (!permission.ok) {
      setCameraError(permission.error ?? 'unknown')
      setPhase('camera-error')
      return
    }

    setLoadLabel('assets')
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const container = containerRef.current
    const sceneDef = SCENES[sceneId]
    if (!container || !sceneDef) {
      setCameraError('unknown')
      setPhase('camera-error')
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
          // Once unlocked by crest scan, stay unlocked (ignore idle on target lost).
          setCinematicPhase((prev) =>
            prev === 'complete' && phaseName !== 'complete' ? prev : phaseName,
          )
        },
        onError: (err) => {
          setCameraError(classifyMindARCameraError(err))
          setPhase('camera-error')
        },
      })

      engineRef.current = engine
      await engine.start()
      setLoadProgress(1)
      setPhase('ar')
    } catch (err) {
      engineRef.current = null
      setCameraError(classifyMindARCameraError(err))
      setPhase('camera-error')
    }
  }, [capability.hasGetUserMedia, capability.hasWebGL, sceneId, stopAR])

  const startExperience = useCallback(() => {
    void audio.unlock()
    analytics.experienceStarted()
    // One tap → camera. The experience begins when the Al Ahly crest is scanned.
    void startAR()
  }, [startAR])

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
    setExploreSection,
    aiOpen,
    setAiOpen,
    cameraError,
    capability,
    sceneDef: SCENES[sceneId],
    startExperience,
    startAR,
    goLanding,
    openFallback,
    openPresidents,
    backFromPresidents,
    stopAR,
  }
}
