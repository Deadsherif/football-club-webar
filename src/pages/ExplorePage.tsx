import { Navigate, useParams } from 'react-router-dom'
import { ExplorePanel } from '@/components/panels/ExplorePanel'
import { useExperienceContext } from '@/experience/ExperienceContext'
import type { ExploreSection } from '@/types/ar'

const VALID: Exclude<ExploreSection, null>[] = [
  'history',
  'trophies',
  'future',
  'board',
  'red-castle',
]

export function ExplorePage() {
  const { section } = useParams<{ section: string }>()
  const { openPresidents, openTrophies, openBoard, openRedCastle, closeExplore } =
    useExperienceContext()

  if (!section || !VALID.includes(section as Exclude<ExploreSection, null>)) {
    return <Navigate to="/menu" replace />
  }

  const exploreSection = section as Exclude<ExploreSection, null>

  return (
    <div className="min-h-dvh bg-pitch">
      <ExplorePanel
        section={exploreSection}
        onClose={closeExplore}
        onEnterPresidents={
          exploreSection === 'history' ? openPresidents : undefined
        }
        onEnterTrophies={
          exploreSection === 'trophies' ? openTrophies : undefined
        }
        onEnterBoard={exploreSection === 'board' ? openBoard : undefined}
        onEnterRedCastle={
          exploreSection === 'red-castle' ? openRedCastle : undefined
        }
      />
    </div>
  )
}
