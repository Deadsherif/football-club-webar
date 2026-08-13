import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { ExperienceProvider } from '@/experience/ExperienceContext'
import { JourneyProvider } from '@/journey/JourneyContext'
import { JourneyChrome } from '@/components/journey/JourneyChrome'
import { HomePage } from '@/pages/HomePage'
import { ARPage } from '@/pages/ARPage'
import { PresidentsPage } from '@/pages/PresidentsPage'
import { BoardPage } from '@/pages/BoardPage'
import { RedCastlePage } from '@/pages/RedCastlePage'
import { LegendsPage } from '@/pages/LegendsPage'
import { TrophiesPage } from '@/pages/TrophiesPage'
import { MenuPage } from '@/pages/MenuPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { CameraErrorPage } from '@/pages/CameraErrorPage'
import { UnsupportedPage } from '@/pages/UnsupportedPage'
import { CompleteJourneyPage } from '@/pages/CompleteJourneyPage'
import { JourneyEntryPage } from '@/pages/JourneyEntryPage'
import { prefetchJourneyAssets } from '@/ar/assets/prefetchAssets'

export default function App() {
  useEffect(() => {
    const id = window.setTimeout(() => prefetchJourneyAssets(), 400)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <ExperienceProvider>
      <JourneyProvider>
        <div className="min-h-dvh bg-pitch-ink text-white">
          <JourneyChrome />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ar" element={<ARPage />} />
            <Route path="/presidents" element={<PresidentsPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/red-castle" element={<RedCastlePage />} />
            <Route path="/legends" element={<LegendsPage />} />
            <Route path="/trophies" element={<TrophiesPage />} />
            <Route path="/journey" element={<JourneyEntryPage />} />
            <Route path="/journey/presidents" element={<PresidentsPage />} />
            <Route path="/journey/trophies" element={<TrophiesPage />} />
            <Route path="/journey/board" element={<BoardPage />} />
            <Route path="/journey/red-castle" element={<RedCastlePage />} />
            <Route path="/journey/complete" element={<CompleteJourneyPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/explore/:section" element={<ExplorePage />} />
            <Route path="/camera-error" element={<CameraErrorPage />} />
            <Route path="/unsupported" element={<UnsupportedPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </JourneyProvider>
    </ExperienceProvider>
  )
}
