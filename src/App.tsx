import { Navigate, Route, Routes } from 'react-router-dom'
import { ExperienceProvider } from '@/experience/ExperienceContext'
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

export default function App() {
  return (
    <ExperienceProvider>
      <div className="min-h-dvh bg-pitch-ink text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ar" element={<ARPage />} />
          <Route path="/presidents" element={<PresidentsPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/red-castle" element={<RedCastlePage />} />
          <Route path="/legends" element={<LegendsPage />} />
          <Route path="/trophies" element={<TrophiesPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/explore/:section" element={<ExplorePage />} />
          <Route path="/camera-error" element={<CameraErrorPage />} />
          <Route path="/unsupported" element={<UnsupportedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ExperienceProvider>
  )
}
