import { FallbackExperience } from '@/components/screens/FallbackExperience'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { analytics } from '@/services/analyticsService'

export function MenuPage() {
  const {
    goLanding,
    openPresidents,
    openLegends,
    openTrophies,
    openBoard,
    openRedCastle,
    openExplore,
  } = useExperienceContext()

  return (
    <FallbackExperience
      onBack={goLanding}
      onOpenPresidents={openPresidents}
      onOpenLegends={openLegends}
      onOpenTrophies={openTrophies}
      onOpenBoard={openBoard}
      onOpenRedCastle={openRedCastle}
      onExplore={(section) => {
        analytics.sectionOpened(section)
        openExplore(section)
      }}
    />
  )
}
