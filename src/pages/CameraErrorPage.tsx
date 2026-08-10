import { CameraErrorScreen } from '@/components/screens/CameraErrorScreen'
import { useExperienceContext } from '@/experience/ExperienceContext'

export function CameraErrorPage() {
  const { cameraError, startAR, openFallback, goLanding } =
    useExperienceContext()

  return (
    <CameraErrorScreen
      kind={cameraError ?? 'unknown'}
      onRetry={startAR}
      onFallback={openFallback}
      onBack={goLanding}
    />
  )
}
