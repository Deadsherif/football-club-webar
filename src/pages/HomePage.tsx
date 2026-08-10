import { Navigate } from 'react-router-dom'
import { DesktopGate } from '@/components/screens/DesktopGate'
import { LandingScreen } from '@/components/screens/LandingScreen'
import { useExperienceContext } from '@/experience/ExperienceContext'

export function HomePage() {
  const {
    capability,
    phase,
    sceneDef,
    startExperience,
    openFallback,
  } = useExperienceContext()

  if (phase === 'unsupported') {
    return <Navigate to="/unsupported" replace />
  }

  const crestSrc = sceneDef?.targetPreviewSrc ?? '/assets/crest.png'
  const pageUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://alahly.example'

  if (capability.isDesktop) {
    return (
      <DesktopGate
        url={pageUrl}
        onPreviewInteractive={openFallback}
        onStartAR={startExperience}
      />
    )
  }

  return <LandingScreen onStart={startExperience} onContinueInteractive={openFallback} crestSrc={crestSrc} />
}
