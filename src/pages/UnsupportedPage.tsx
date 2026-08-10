import { UnsupportedScreen } from '@/components/screens/UnsupportedScreen'
import { useExperienceContext } from '@/experience/ExperienceContext'

export function UnsupportedPage() {
  const { openFallback, startAR } = useExperienceContext()

  return (
    <UnsupportedScreen onContinue={openFallback} onRetry={startAR} />
  )
}
