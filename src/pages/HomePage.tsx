import { Navigate } from 'react-router-dom'
import { DesktopGate } from '@/components/screens/DesktopGate'
import { LandingScreen } from '@/components/screens/LandingScreen'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { useJourney } from '@/journey/JourneyContext'
import { publicUrl } from '@/utils/publicUrl'

export function HomePage() {
  const {
    capability,
    phase,
    sceneDef,
    startExperience,
    openFallback,
  } = useExperienceContext()
  const journey = useJourney()

  if (phase === 'unsupported') {
    return <Navigate to="/unsupported" replace />
  }

  const crestSrc = publicUrl(sceneDef?.targetPreviewSrc ?? '/assets/crest.png')
  const pageUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://alahly.example'

  const startAr = () => {
    journey.clearScanStart()
    startExperience()
  }

  const startJourneyScan = () => {
    journey.armScanStart()
    startExperience()
  }

  if (capability.isDesktop) {
    return (
      <DesktopGate
        url={pageUrl}
        onPreviewInteractive={openFallback}
        onStartAR={startAr}
        onStartJourneyScan={startJourneyScan}
        onStartJourneyDirect={journey.start}
      />
    )
  }

  return (
    <LandingScreen
      onStartAr={startAr}
      onStartJourneyScan={startJourneyScan}
      onContinueInteractive={openFallback}
      crestSrc={crestSrc}
    />
  )
}
