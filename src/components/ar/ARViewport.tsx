import type { RefObject } from 'react'
import type { CinematicPhase, ExploreSection, TrackingState } from '@/types/ar'
import { ScannerOverlay } from '@/components/ar/ScannerOverlay'
import { CinematicTitles } from '@/components/ar/CinematicTitles'
import { FloatingARMenu } from '@/components/ar/FloatingARMenu'
import { AskAlAhlyButton } from '@/components/ar/AskAlAhlyButton'
import { t } from '@/i18n'

interface ARViewportProps {
  containerRef: RefObject<HTMLDivElement | null>
  trackingState: TrackingState
  cinematicPhase: CinematicPhase
  exploreSection: ExploreSection
  onSelectSection: (section: Exclude<ExploreSection, null>) => void
  onOpenAI: () => void
  onExit: () => void
  showOverlay?: boolean
}

export function ARViewport({
  containerRef,
  trackingState,
  cinematicPhase,
  exploreSection,
  onSelectSection,
  onOpenAI,
  onExit,
  showOverlay = true,
}: ARViewportProps) {
  const copy = t()
  const showMenu = cinematicPhase === 'complete' && trackingState !== 'searching'
  const inCinematic =
    cinematicPhase !== 'idle' &&
    cinematicPhase !== 'complete' &&
    trackingState === 'tracking'

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {showOverlay && (
        <>
          <div
            className={`letterbox letterbox-top ${inCinematic || cinematicPhase === 'title' || cinematicPhase === 'legacy' ? 'letterbox-on' : ''}`}
          />
          <div
            className={`letterbox letterbox-bottom ${inCinematic || cinematicPhase === 'title' || cinematicPhase === 'legacy' ? 'letterbox-on' : ''}`}
          />

          <div
            className={`pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.55)_100%)] transition-opacity duration-700 ${
              inCinematic ? 'opacity-100' : 'opacity-40'
            }`}
          />

          {(cinematicPhase === 'idle' || cinematicPhase === 'glow') &&
            trackingState !== 'tracking' && (
              <ScannerOverlay trackingState={trackingState} />
            )}

          <CinematicTitles phase={cinematicPhase} />

          {showMenu && !exploreSection && (
            <>
              <FloatingARMenu onSelect={onSelectSection} />
              <AskAlAhlyButton onClick={onOpenAI} />
            </>
          )}

          <button
            type="button"
            onClick={onExit}
            className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-40 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-white backdrop-blur-sm"
          >
            {copy.exitAr}
          </button>
        </>
      )}
    </div>
  )
}
