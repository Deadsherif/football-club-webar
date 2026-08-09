import type { RefObject } from 'react'
import type { CinematicPhase, ExploreSection, TrackingState } from '@/types/ar'
import { ScannerOverlay } from '@/components/ar/ScannerOverlay'
import { FloatingARMenu } from '@/components/ar/FloatingARMenu'
import { AskAlAhlyButton } from '@/components/ar/AskAlAhlyButton'
import { t } from '@/i18n'

interface ARViewportProps {
  containerRef: RefObject<HTMLDivElement | null>
  trackingState: TrackingState
  cinematicPhase: CinematicPhase
  exploreSection: ExploreSection
  onSelectSection: (section: Exclude<ExploreSection, null>) => void
  onOpenPresidents: () => void
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
  onOpenPresidents,
  onOpenAI,
  onExit,
  showOverlay = true,
}: ARViewportProps) {
  const copy = t()
  const unlocked = cinematicPhase === 'complete'
  const showMenu = unlocked
  const searching = cinematicPhase === 'idle'

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* isolation keeps MindAR's video (z-index -2) from falling behind bg-black */}
      <div
        ref={containerRef}
        className="mindar-container absolute inset-0 z-0 h-full w-full overflow-hidden"
      />

      {showOverlay && (
        <>
          <div
            className={`pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(0,0,0,0.45)_100%)] transition-opacity duration-700 ${
              searching ? 'opacity-25' : 'opacity-35'
            }`}
          />

          {searching && <ScannerOverlay trackingState={trackingState} />}

          {showMenu && !exploreSection && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-[max(4.5rem,env(safe-area-inset-top)+3.5rem)] z-20 px-6 text-center">
                <p className="font-title text-lg tracking-[0.2em] text-white">
                  {copy.fallbackTitle}
                </p>
                <p className="mt-2 text-sm text-white/60">{copy.fallbackBody}</p>
              </div>
              <FloatingARMenu
                onSelect={onSelectSection}
                onOpenPresidents={onOpenPresidents}
              />
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
