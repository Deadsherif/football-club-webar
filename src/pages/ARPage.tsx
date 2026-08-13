import { Navigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
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
import { useJourney } from '@/journey/JourneyContext'
import { getHistoricalSquad, historicalSquads } from '@/data/squads'
import { t } from '@/i18n'

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
  const journey = useJourney()
  const launchedJourneyRef = useRef(false)
  const journeyCabinetRef = useRef<string | null>(null)
  const copy = t()

  useEffect(() => {
    if (!journey.pendingScanStart) {
      launchedJourneyRef.current = false
      return
    }
    if (trackingState !== 'tracking' || launchedJourneyRef.current) return
    launchedJourneyRef.current = true
    journey.startFromScan()
  }, [journey, trackingState])

  useEffect(() => {
    if (!journey.active || phase !== 'ar') {
      journeyCabinetRef.current = null
      return
    }

    const chapter = journey.chapter
    if (!chapter || chapter === 'complete') return

    const firstInChapter = journeyCabinetRef.current !== chapter
    journeyCabinetRef.current = chapter

    if (chapter === 'presidents') {
      if (firstInChapter) openPresidents()
      selectArPresident(firstInChapter ? null : (journey.step?.itemId ?? null))
      return
    }
    if (chapter === 'trophies') {
      if (firstInChapter) openTrophies()
      selectArTrophy(firstInChapter ? null : (journey.step?.itemId ?? null))
      return
    }
    if (chapter === 'board') {
      if (firstInChapter) openBoard()
      selectArBoardMember(firstInChapter ? null : (journey.step?.itemId ?? null))
      return
    }
    if (chapter === 'red-castle') {
      if (firstInChapter) openRedCastle()
      selectArRedCastleMember(
        firstInChapter ? null : (journey.step?.itemId ?? null),
      )
    }
  }, [
    journey.active,
    journey.chapter,
    journey.step?.itemId,
    journey.stepIndex,
    openBoard,
    openPresidents,
    openRedCastle,
    openTrophies,
    phase,
    selectArBoardMember,
    selectArPresident,
    selectArRedCastleMember,
    selectArTrophy,
  ])

  const handleExit = () => {
    journey.clearScanStart()
    if (journey.active) {
      journey.exit()
      return
    }
    goLanding()
  }

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
  if (!journey.active && phase === 'trophies') {
    return <Navigate to="/trophies" replace />
  }
  if (!journey.active && phase === 'board') {
    return <Navigate to="/board" replace />
  }
  if (!journey.active && phase === 'red-castle') {
    return <Navigate to="/red-castle" replace />
  }

  const showArShell = phase === 'loading' || phase === 'ar'
  const activeLegendSquad =
    getHistoricalSquad(legendSquadId) ?? historicalSquads[0]
  const journeyHere = journey.active || journey.pendingScanStart
  const menuHidden =
    journeyHere ||
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
          onExit={handleExit}
          showOverlay={phase === 'ar'}
          menuHidden={menuHidden}
        />
      )}

      {phase === 'ar' && journey.pendingScanStart && (
        <div className="pointer-events-none absolute inset-x-0 top-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] z-40 px-4 text-center">
          <p className="mx-auto max-w-sm rounded-full border border-pitch-gold/35 bg-black/65 px-4 py-2 text-[10px] tracking-[0.16em] text-pitch-gold backdrop-blur-md">
            {copy.journeyStartHint}
          </p>
        </div>
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

      {phase === 'ar' && presidentsOpen && !journey.active && (
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

      {phase === 'ar' && boardOpen && !journey.active && (
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

      {phase === 'ar' && redCastleOpen && !journey.active && (
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

      {phase === 'ar' && trophiesOpen && !journey.active && (
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

      {phase === 'ar' && legendsOpen && !journey.active && (
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
