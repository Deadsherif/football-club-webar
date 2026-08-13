import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  firstIndexOfChapter,
  getJourneyStep,
  journeySteps,
  type JourneyChapter,
  type JourneyStep,
} from '@/data/journey'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { audio } from '@/services/audioService'

export type JourneyDwellSpeed = 'slow' | 'normal' | 'fast'

export interface JourneyViewSettings {
  /** Show story caption under the cards */
  showCaptions: boolean
  /** Smaller caption so cards stay visible */
  compactCaptions: boolean
  /** Allow orbit / pinch while journey is active */
  freeLook: boolean
  /** Show chapter chip bar */
  showChapterBar: boolean
  /** Auto-advance pacing */
  dwellSpeed: JourneyDwellSpeed
}

const DEFAULT_VIEW: JourneyViewSettings = {
  showCaptions: true,
  compactCaptions: true,
  freeLook: true,
  showChapterBar: true,
  dwellSpeed: 'normal',
}

const DWELL_BY_SPEED: Record<JourneyDwellSpeed, number> = {
  slow: 14,
  normal: 9,
  fast: 5,
}

export interface JourneyContextValue {
  active: boolean
  playing: boolean
  stepIndex: number
  total: number
  step: JourneyStep | null
  chapter: JourneyChapter | null
  progress: number
  view: JourneyViewSettings
  /** Waiting for crest scan before starting the history journey. */
  pendingScanStart: boolean
  start: () => void
  /** Arm journey start: after crest is detected, call startFromScan(). */
  armScanStart: () => void
  /** Clear arm without starting (e.g. user exits AR). */
  clearScanStart: () => void
  /** Start journey after crest detection (consumes pendingScanStart). */
  startFromScan: () => void
  exit: () => void
  next: () => void
  prev: () => void
  pause: () => void
  resume: () => void
  seek: (index: number) => void
  seekChapter: (chapter: JourneyChapter) => void
  setView: (patch: Partial<JourneyViewSettings>) => void
}

const JourneyContext = createContext<JourneyContextValue | null>(null)

export function JourneyProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { stopAR } = useExperienceContext()
  const locationRef = useRef(location.pathname)
  const [active, setActive] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [view, setViewState] = useState<JourneyViewSettings>(DEFAULT_VIEW)
  const [pendingScanStart, setPendingScanStart] = useState(false)
  const dwellRef = useRef(0)
  const playingRef = useRef(false)
  const activeRef = useRef(false)
  const indexRef = useRef(0)
  const dwellSpeedRef = useRef(view.dwellSpeed)
  const pendingScanRef = useRef(false)

  useEffect(() => {
    locationRef.current = location.pathname
  }, [location.pathname])
  useEffect(() => {
    playingRef.current = playing
  }, [playing])
  useEffect(() => {
    activeRef.current = active
  }, [active])
  useEffect(() => {
    indexRef.current = stepIndex
  }, [stepIndex])
  useEffect(() => {
    dwellSpeedRef.current = view.dwellSpeed
  }, [view.dwellSpeed])

  const goToIndex = useCallback(
    (index: number, opts?: { play?: boolean }) => {
      const clamped = Math.max(0, Math.min(journeySteps.length - 1, index))
      const step = getJourneyStep(clamped)
      if (!step) return
      setStepIndex(clamped)
      indexRef.current = clamped
      dwellRef.current = 0
      if (typeof opts?.play === 'boolean') {
        setPlaying(opts.play)
        playingRef.current = opts.play
      }
      // Stay on /ar so mobile scan journey never jumps to standalone interactive pages.
      if (locationRef.current !== '/ar') {
        navigate(step.route)
      }
    },
    [navigate],
  )

  const start = useCallback(() => {
    void audio.play('ui')
    pendingScanRef.current = false
    setPendingScanStart(false)
    setActive(true)
    activeRef.current = true
    setPlaying(false)
    playingRef.current = false
    const presidentsStart = Math.max(0, firstIndexOfChapter('presidents'))
    goToIndex(presidentsStart, { play: false })
  }, [goToIndex])

  const armScanStart = useCallback(() => {
    void audio.play('ui')
    pendingScanRef.current = true
    setPendingScanStart(true)
  }, [])

  const clearScanStart = useCallback(() => {
    pendingScanRef.current = false
    setPendingScanStart(false)
  }, [])

  const startFromScan = useCallback(() => {
    if (!pendingScanRef.current) return
    pendingScanRef.current = false
    setPendingScanStart(false)
    start()
  }, [start])

  const exit = useCallback(() => {
    void audio.play('ui')
    pendingScanRef.current = false
    setPendingScanStart(false)
    setActive(false)
    activeRef.current = false
    setPlaying(false)
    playingRef.current = false
    dwellRef.current = 0
    stopAR()
    navigate('/')
  }, [navigate, stopAR])

  const next = useCallback(() => {
    void audio.play('ui')
    const nextIndex = indexRef.current + 1
    if (nextIndex >= journeySteps.length) {
      setPlaying(false)
      playingRef.current = false
      goToIndex(journeySteps.length - 1, { play: false })
      return
    }
    goToIndex(nextIndex)
  }, [goToIndex])

  const prev = useCallback(() => {
    void audio.play('ui')
    goToIndex(indexRef.current - 1)
  }, [goToIndex])

  const pause = useCallback(() => {
    void audio.play('ui')
    setPlaying(false)
    playingRef.current = false
  }, [])

  const resume = useCallback(() => {
    void audio.play('ui')
    setPlaying(true)
    playingRef.current = true
    dwellRef.current = 0
  }, [])

  const seek = useCallback(
    (index: number) => {
      void audio.play('ui')
      goToIndex(index, { play: false })
    },
    [goToIndex],
  )

  const seekChapter = useCallback(
    (chapter: JourneyChapter) => {
      const index = journeySteps.findIndex((step) => step.chapter === chapter)
      if (index >= 0) seek(index)
    },
    [seek],
  )

  const setView = useCallback((patch: Partial<JourneyViewSettings>) => {
    setViewState((prev) => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    if (!active) return

    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      )
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!activeRef.current || isTypingTarget(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      switch (event.code) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'KeyD':
        case 'PageDown':
          event.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'KeyA':
        case 'PageUp':
          event.preventDefault()
          prev()
          break
        case 'Space':
          event.preventDefault()
          if (playingRef.current) pause()
          else resume()
          break
        case 'Escape':
          event.preventDefault()
          exit()
          break
        case 'Home':
          event.preventDefault()
          seek(0)
          break
        case 'End':
          event.preventDefault()
          seek(journeySteps.length - 1)
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, next, prev, pause, resume, exit, seek])

  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (playingRef.current && activeRef.current) {
        const step = getJourneyStep(indexRef.current)
        if (step && step.chapter !== 'complete') {
          dwellRef.current += dt
          const limit = DWELL_BY_SPEED[dwellSpeedRef.current]
          if (dwellRef.current >= limit) {
            dwellRef.current = 0
            const nextIndex = indexRef.current + 1
            if (nextIndex < journeySteps.length) {
              goToIndex(nextIndex)
            } else {
              setPlaying(false)
              playingRef.current = false
            }
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, goToIndex])

  const step = getJourneyStep(stepIndex)
  const value = useMemo<JourneyContextValue>(
    () => ({
      active,
      playing,
      stepIndex,
      total: journeySteps.length,
      step,
      chapter: step?.chapter ?? null,
      progress: journeySteps.length > 1 ? stepIndex / (journeySteps.length - 1) : 0,
      view,
      pendingScanStart,
      start,
      armScanStart,
      clearScanStart,
      startFromScan,
      exit,
      next,
      prev,
      pause,
      resume,
      seek,
      seekChapter,
      setView,
    }),
    [
      active,
      playing,
      stepIndex,
      step,
      view,
      pendingScanStart,
      start,
      armScanStart,
      clearScanStart,
      startFromScan,
      exit,
      next,
      prev,
      pause,
      resume,
      seek,
      seekChapter,
      setView,
    ],
  )

  return (
    <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
  )
}

export function useJourney(): JourneyContextValue {
  const value = useContext(JourneyContext)
  if (!value) {
    throw new Error('useJourney must be used within JourneyProvider')
  }
  return value
}

export function useJourneyOptional(): JourneyContextValue | null {
  return useContext(JourneyContext)
}
