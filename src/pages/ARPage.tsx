import { Navigate } from 'react-router-dom'
import { ARViewport } from '@/components/ar/ARViewport'
import { ExplorePanel } from '@/components/panels/ExplorePanel'
import { AIAssistant } from '@/components/panels/AIAssistant'
import { LegendsHUD } from '@/components/legends/LegendsHUD'
import { PresidentsHUD } from '@/components/presidents/PresidentsHUD'
import { BoardHUD } from '@/components/board/BoardHUD'
import { RedCastleHUD } from '@/components/red-castle/RedCastleHUD'
import { TrophiesHUD } from '@/components/trophies/TrophiesHUD'
import { LoadingScreen } from '@/components/screens/LoadingScreen'
import { useExperienceContext } from '@/experience/ExperienceContext'
import { getHistoricalSquad, historicalSquads } from '@/data/squads'

export function ARPage() {
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
    legendsOpen,
    presidentsOpen,
    boardOpen,
    redCastleOpen,
    trophiesOpen,
    selectedPresident,
    selectedBoardMember,
    selectedRedCastleMember,
    selectedTrophy,
    legendSquadId,
    selectedLegend,
    openPresidents,
    openLegends,
    openTrophies,
    openBoard,
    openRedCastle,
    closeLegends,
    closePresidentsAr,
    closeBoardAr,
    closeRedCastleAr,
    closeTrophiesAr,
    selectArPresident,
    selectArBoardMember,
    selectArRedCastleMember,
    selectArTrophy,
    cycleArPresident,
    cycleArBoardMember,
    cycleArRedCastleMember,
    cycleArTrophy,
    closeExplore,
    selectLegendSquad,
    selectLegendPlayer,
    goLanding,
  } = useExperienceContext()

  if (phase === 'camera-error') {
    return <Navigate to="/camera-error" replace />
  }
  if (phase === 'unsupported') {
    return <Navigate to="/unsupported" replace />
  }
  if (phase === 'landing' || phase === 'desktop') {
    return <Navigate to="/" replace />
  }
  if (phase === 'fallback') {
    return <Navigate to="/menu" replace />
  }
  if (phase === 'trophies') {
    return <Navigate to="/trophies" replace />
  }
  if (phase === 'board') {
    return <Navigate to="/board" replace />
  }
  if (phase === 'red-castle') {
    return <Navigate to="/red-castle" replace />
  }

  const showArShell = phase === 'loading' || phase === 'ar'
  const activeLegendSquad =
    getHistoricalSquad(legendSquadId) ?? historicalSquads[0]
  const menuHidden =
    legendsOpen ||
    presidentsOpen ||
    boardOpen ||
    redCastleOpen ||
    trophiesOpen

  return (
    <>
      {showArShell && (
        <ARViewport
          containerRef={containerRef}
          trackingState={trackingState}
          cinematicPhase={cinematicPhase}
          exploreSection={exploreSection}
          onSelectSection={setExploreSection}
          onOpenPresidents={openPresidents}
          onOpenLegends={openLegends}
          onOpenTrophies={openTrophies}
          onOpenBoard={openBoard}
          onOpenRedCastle={openRedCastle}
          onOpenAI={() => setAiOpen(true)}
          onExit={goLanding}
          showOverlay={phase === 'ar'}
          menuHidden={menuHidden}
        />
      )}

      {phase === 'ar' && exploreSection && (
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
      )}

      {phase === 'ar' && (
        <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      )}

      {phase === 'ar' && presidentsOpen && (
        <PresidentsHUD
          phase={selectedPresident ? 'selected' : 'explore'}
          yearLabel={selectedPresident?.yearsLabel ?? '1907'}
          selected={selectedPresident ?? undefined}
          showLegacyBanner={false}
          onBack={closePresidentsAr}
          onPrev={() => cycleArPresident(-1)}
          onNext={() => cycleArPresident(1)}
          onCloseDetail={() => selectArPresident(null)}
        />
      )}

      {phase === 'ar' && boardOpen && (
        <BoardHUD
          phase={selectedBoardMember ? 'selected' : 'explore'}
          roleLabel={selectedBoardMember?.yearsLabel ?? 'Board'}
          selected={selectedBoardMember ?? undefined}
          showBanner={false}
          onBack={closeBoardAr}
          onPrev={() => cycleArBoardMember(-1)}
          onNext={() => cycleArBoardMember(1)}
          onCloseDetail={() => selectArBoardMember(null)}
        />
      )}

      {phase === 'ar' && redCastleOpen && (
        <RedCastleHUD
          phase={selectedRedCastleMember ? 'selected' : 'explore'}
          roleLabel={selectedRedCastleMember?.yearsLabel ?? 'El Qalaa'}
          selected={selectedRedCastleMember ?? undefined}
          showBanner={false}
          onBack={closeRedCastleAr}
          onPrev={() => cycleArRedCastleMember(-1)}
          onNext={() => cycleArRedCastleMember(1)}
          onCloseDetail={() => selectArRedCastleMember(null)}
        />
      )}

      {phase === 'ar' && trophiesOpen && (
        <TrophiesHUD
          phase={selectedTrophy ? 'selected' : 'explore'}
          chipLabel={selectedTrophy?.nameAr ?? 'البطولات'}
          selected={selectedTrophy ?? undefined}
          showLegacyBanner={false}
          onBack={closeTrophiesAr}
          onPrev={() => cycleArTrophy(-1)}
          onNext={() => cycleArTrophy(1)}
          onCloseDetail={() => selectArTrophy(null)}
        />
      )}

      {phase === 'ar' && legendsOpen && (
        <LegendsHUD
          squad={activeLegendSquad}
          selected={selectedLegend}
          onBack={closeLegends}
          onSelectSquad={selectLegendSquad}
          onPreviousSquad={() => {
            const index = historicalSquads.findIndex(
              (squad) => squad.id === legendSquadId,
            )
            selectLegendSquad(
              historicalSquads[
                (index - 1 + historicalSquads.length) % historicalSquads.length
              ].id,
            )
          }}
          onNextSquad={() => {
            const index = historicalSquads.findIndex(
              (squad) => squad.id === legendSquadId,
            )
            selectLegendSquad(
              historicalSquads[(index + 1) % historicalSquads.length].id,
            )
          }}
          onPreviousPlayer={() => {
            const playerIds = activeLegendSquad.playerIds
            const index = Math.max(
              0,
              playerIds.findIndex((id) => id === selectedLegend?.id),
            )
            selectLegendPlayer(
              playerIds[(index - 1 + playerIds.length) % playerIds.length],
            )
          }}
          onNextPlayer={() => {
            const playerIds = activeLegendSquad.playerIds
            const index = Math.max(
              0,
              playerIds.findIndex((id) => id === selectedLegend?.id),
            )
            selectLegendPlayer(playerIds[(index + 1) % playerIds.length])
          }}
          onClosePlayer={() => selectLegendPlayer(null)}
        />
      )}

      {phase === 'loading' && (
        <LoadingScreen progress={loadProgress} label={loadLabel} />
      )}
    </>
  )
}
