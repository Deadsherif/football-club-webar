import { useEffect, useState } from 'react'
import type { TrophiesPhase } from '@/ar/trophies/TrophiesController'
import type { TrophyDefinition } from '@/data/trophies'
import { t } from '@/i18n'
import { audio } from '@/services/audioService'

interface TrophiesHUDProps {
  phase: TrophiesPhase
  chipLabel: string
  selected?: TrophyDefinition
  showLegacyBanner: boolean
  onBack: () => void
  onPrev: () => void
  onNext: () => void
  onCloseDetail: () => void
}

function titlesLabel(count: number): string {
  if (count === 0) return 'لا ألقاب رسمية'
  if (count === 1) return 'لقب واحد'
  if (count === 2) return 'لقبان'
  if (count >= 3 && count <= 10) return `${count} ألقاب`
  return `${count} لقباً`
}

export function TrophiesHUD({
  phase,
  chipLabel,
  selected,
  showLegacyBanner,
  onBack,
  onPrev,
  onNext,
  onCloseDetail,
}: TrophiesHUDProps) {
  const copy = t()
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    setDetailOpen(false)
  }, [selected?.id])

  const intro =
    phase === 'titles' ||
    phase === 'lights' ||
    phase === 'reveal' ||
    phase === 'tagline'

  return (
    <>
      {(phase === 'explore' || phase === 'selected') && (
        <div className="pointer-events-none absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-full border border-white/15 bg-black/55 px-4 py-1.5 font-title text-sm tracking-[0.2em] text-pitch-gold backdrop-blur-md">
            {selected?.nameAr ?? chipLabel}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          void audio.play('ui')
          onBack()
        }}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-40 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-white backdrop-blur-md"
      >
        {copy.trophiesBack}
      </button>

      {intro && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 px-6 text-center">
          {phase === 'titles' && (
            <div className="title-reveal title-reveal-active">
              <p className="font-title text-4xl tracking-[0.28em] text-white sm:text-5xl">
                {copy.brand}
              </p>
              <p className="mt-4 font-title text-sm tracking-[0.4em] text-pitch-gold">
                {copy.trophiesCabinet}
              </p>
            </div>
          )}
          {phase === 'tagline' && (
            <div className="title-reveal title-reveal-active space-y-4">
              <p className="font-title text-lg tracking-[0.28em] text-pitch-gold sm:text-xl">
                {copy.trophiesCentury}
              </p>
              <p className="font-title text-sm tracking-[0.35em] text-white/80">
                {copy.trophiesExplore}
              </p>
            </div>
          )}
          {(phase === 'lights' || phase === 'reveal') && (
            <p className="font-title text-xs tracking-[0.3em] text-white/50">
              {copy.trophiesEntering}
            </p>
          )}
        </div>
      )}

      {showLegacyBanner && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-30 flex justify-center">
          <p className="title-reveal title-reveal-active font-title text-sm tracking-[0.35em] text-pitch-gold">
            {copy.legacyContinues}
          </p>
        </div>
      )}

      {selected && phase === 'selected' && (
        <div
          className="absolute top-[max(4.5rem,calc(env(safe-area-inset-top)+3.8rem))] right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))]"
          dir="rtl"
        >
          <div className="max-h-[min(52dvh,400px)] w-full overflow-y-auto rounded-3xl border border-white/12 bg-[#0a0506]/88 p-5 text-start shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-title text-[10px] tracking-[0.28em] text-pitch-gold">
                  {copy.trophiesOf}
                </p>
                <h2 className="mt-1 font-title text-xl tracking-[0.06em] text-white">
                  {selected.nameAr}
                </h2>
                <p className="mt-2 text-xs text-white/70">
                  {selected.categoryAr} · {selected.statusAr}
                </p>
                <p className="mt-2 text-[10px] font-semibold tracking-[0.12em] text-ahly-red">
                  {titlesLabel(selected.officialTitles)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onCloseDetail()
                }}
                className="text-[10px] tracking-[0.16em] text-white/45"
              >
                {copy.close}
              </button>
            </div>

            {!detailOpen && (
              <>
                <p className="mt-4 text-xs leading-relaxed text-white/75">
                  {selected.summaryAr}
                </p>
                {selected.achievements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      void audio.play('ui')
                      setDetailOpen(true)
                    }}
                    className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-pitch-gold"
                  >
                    {copy.trophiesShowMore}
                  </button>
                )}
              </>
            )}

            {detailOpen && (
              <div className="mt-4">
                <p className="font-title text-[10px] tracking-[0.22em] text-pitch-gold">
                  {copy.trophiesSeasons}
                </p>
                <ul className="mt-2 max-h-[28dvh] space-y-1.5 overflow-y-auto">
                  {selected.achievements.map((a, i) => (
                    <li
                      key={`${a.season}-${a.trophyNumber ?? i}`}
                      className="flex items-baseline justify-between gap-3 text-xs text-white/70"
                    >
                      <span>
                        {a.season}
                        {a.exactDate ? ` · ${a.exactDate}` : ''}
                      </span>
                      <span className="shrink-0 text-white/55">
                        {a.achievementAr}
                        {a.trophyNumber != null ? ` · #${a.trophyNumber}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    void audio.play('ui')
                    setDetailOpen(false)
                  }}
                  className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-pitch-gold"
                >
                  {copy.trophiesShowLess}
                </button>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onPrev()
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-[10px] tracking-[0.2em] text-white/80"
              >
                {copy.trophiesPrev}
              </button>
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onNext()
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-[10px] tracking-[0.2em] text-white/80"
              >
                {copy.trophiesNext}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'explore' && !selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 space-y-1 px-4 text-center text-[10px] tracking-[0.22em] text-white/40">
          <p>{copy.trophiesHint}</p>
          <p className="text-white/55">{copy.trophiesNavigate}</p>
        </div>
      )}
    </>
  )
}
