import { lazy, Suspense } from 'react'
import { LandingScreen } from '@/components/screens/LandingScreen'
import { LoadingScreen } from '@/components/screens/LoadingScreen'
import { CameraErrorScreen } from '@/components/screens/CameraErrorScreen'
import { DesktopGate } from '@/components/screens/DesktopGate'
import { UnsupportedScreen } from '@/components/screens/UnsupportedScreen'
import { FallbackExperience } from '@/components/screens/FallbackExperience'
import { ARViewport } from '@/components/ar/ARViewport'
import { ExplorePanel } from '@/components/panels/ExplorePanel'
import { AIAssistant } from '@/components/panels/AIAssistant'
import { useExperience } from '@/hooks/useExperience'
import { CLUB_CREST_SCENE } from '@/config/scenes'
import { analytics } from '@/services/analyticsService'

const PresidentsExperience = lazy(() =>
  import('@/components/presidents/PresidentsExperience').then((m) => ({
    default: m.PresidentsExperience,
  })),
)

const TrophiesExperience = lazy(() =>
  import('@/components/trophies/TrophiesExperience').then((m) => ({
    default: m.TrophiesExperience,
  })),
)

export default function App() {
  const {
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
    sceneDef,
    startExperience,
    startAR,
    goLanding,
    openFallback,
    openPresidents,
    backFromPresidents,
    openTrophies,
    backFromTrophies,
  } = useExperience({ sceneId: CLUB_CREST_SCENE.id })

  const crestSrc = sceneDef?.targetPreviewSrc ?? '/assets/crest.png'
  const showArShell = phase === 'loading' || phase === 'ar'
  const pageUrl = typeof window !== 'undefined' ? window.location.href : 'https://alahly.example'

  return (
    <div className="min-h-dvh bg-pitch-ink text-white">
      {phase === 'desktop' && (
        <DesktopGate
          url={pageUrl}
          onPreviewInteractive={openFallback}
          onStartAR={startExperience}
        />
      )}

      {phase === 'landing' && (
        <LandingScreen onStart={startExperience} crestSrc={crestSrc} />
      )}

      {showArShell && (
        <ARViewport
          containerRef={containerRef}
          trackingState={trackingState}
          cinematicPhase={cinematicPhase}
          exploreSection={exploreSection}
          onSelectSection={setExploreSection}
          onOpenPresidents={openPresidents}
          onOpenTrophies={openTrophies}
          onOpenAI={() => setAiOpen(true)}
          onExit={goLanding}
          showOverlay={phase === 'ar'}
        />
      )}

      {(phase === 'ar' || phase === 'fallback') && exploreSection && (
        <ExplorePanel
          section={exploreSection}
          onClose={() => setExploreSection(null)}
          onEnterPresidents={
            exploreSection === 'history' ? openPresidents : undefined
          }
          onEnterTrophies={
            exploreSection === 'trophies' ? openTrophies : undefined
          }
        />
      )}

      {phase === 'ar' && (
        <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      )}

      {phase === 'loading' && (
        <LoadingScreen progress={loadProgress} label={loadLabel} />
      )}

      {phase === 'camera-error' && cameraError && (
        <CameraErrorScreen
          kind={cameraError}
          onRetry={startAR}
          onFallback={openFallback}
          onBack={goLanding}
        />
      )}

      {phase === 'unsupported' && (
        <UnsupportedScreen onContinue={openFallback} onRetry={startAR} />
      )}

      {phase === 'fallback' && !exploreSection && (
        <FallbackExperience
          onBack={goLanding}
          onOpenPresidents={openPresidents}
          onOpenTrophies={openTrophies}
          onExplore={(section) => {
            analytics.sectionOpened(section)
            setExploreSection(section)
          }}
        />
      )}

      {phase === 'presidents' && (
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
              LOADING STADIUM…
            </div>
          }
        >
          <PresidentsExperience onBack={backFromPresidents} />
        </Suspense>
      )}

      {phase === 'trophies' && (
        <Suspense
          fallback={
            <div className="flex min-h-dvh items-center justify-center bg-pitch-ink font-title tracking-[0.2em] text-white/60">
              LOADING TROPHIES…
            </div>
          }
        >
          <TrophiesExperience onBack={backFromTrophies} />
        </Suspense>
      )}
    </div>
  )
}
