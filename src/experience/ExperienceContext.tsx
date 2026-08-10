import { createContext, useContext, type ReactNode } from 'react'
import { useExperience } from '@/hooks/useExperience'
import { CLUB_CREST_SCENE } from '@/config/scenes'

type ExperienceValue = ReturnType<typeof useExperience>

const ExperienceContext = createContext<ExperienceValue | null>(null)

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const value = useExperience({ sceneId: CLUB_CREST_SCENE.id })
  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  )
}

export function useExperienceContext(): ExperienceValue {
  const value = useContext(ExperienceContext)
  if (!value) {
    throw new Error('useExperienceContext must be used within ExperienceProvider')
  }
  return value
}
