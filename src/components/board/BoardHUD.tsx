import type { BoardPhase } from '@/ar/board/BoardController'
import type { BoardMemberCard } from '@/data/boardMembers'
import { t } from '@/i18n'
import { audio } from '@/services/audioService'

interface BoardHUDProps {
  phase: BoardPhase
  roleLabel: string
  selected?: BoardMemberCard
  showBanner: boolean
  onBack: () => void
  onPrev: () => void
  onNext: () => void
  onCloseDetail: () => void
}

export function BoardHUD({
  phase,
  roleLabel,
  selected,
  showBanner,
  onBack,
  onPrev,
  onNext,
  onCloseDetail,
}: BoardHUDProps) {
  const copy = t()
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
            {selected?.yearsLabel ?? roleLabel}
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
        {copy.boardBack}
      </button>

      {intro && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 px-6 text-center">
          {phase === 'titles' && (
            <div className="title-reveal title-reveal-active">
              <p className="font-title text-4xl tracking-[0.28em] text-white sm:text-5xl">
                {copy.brand}
              </p>
              <p className="mt-4 font-title text-sm tracking-[0.4em] text-pitch-gold">
                {copy.boardLeaders}
              </p>
            </div>
          )}
          {phase === 'tagline' && (
            <div className="title-reveal title-reveal-active space-y-4">
              <p className="font-title text-lg tracking-[0.28em] text-pitch-gold sm:text-xl">
                {copy.boardCentury}
              </p>
              <p className="font-title text-sm tracking-[0.35em] text-white/80">
                {copy.boardExplore}
              </p>
            </div>
          )}
          {(phase === 'lights' || phase === 'reveal') && (
            <p className="font-title text-xs tracking-[0.3em] text-white/50">
              {copy.boardEntering}
            </p>
          )}
        </div>
      )}

      {showBanner && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-30 flex justify-center">
          <p className="title-reveal title-reveal-active font-title text-sm tracking-[0.35em] text-pitch-gold">
            {copy.boardBanner}
          </p>
        </div>
      )}

      {selected && phase === 'selected' && (
        <div className="absolute top-[max(4.5rem,calc(env(safe-area-inset-top)+3.8rem))] right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))]">
          <div className="max-h-[min(48dvh,360px)] w-full overflow-y-auto rounded-3xl border border-white/12 bg-[#0a0506]/88 p-4 text-start shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.2em] text-pitch-gold">
                  {copy.boardOf}
                </p>
                <h3 className="mt-1 font-title text-xl tracking-[0.08em] text-white">
                  {selected.name}
                </h3>
                {selected.arabicName && (
                  <p className="mt-1 text-sm text-white/55">{selected.arabicName}</p>
                )}
                <p className="mt-2 text-xs tracking-[0.14em] text-pitch-gold">
                  {selected.roleAr} · {selected.roleEn}
                </p>
                {selected.endYear === null && (
                  <p className="mt-2 inline-block rounded-full bg-ahly-red/80 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-white">
                    {copy.boardCurrent}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onCloseDetail()
                }}
                className="shrink-0 text-[11px] tracking-[0.16em] text-white/45"
              >
                {copy.close}
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-white/70">
              {selected.description}
            </p>

            {selected.source && (
              <p className="mt-4 text-[9px] text-white/30">Source: {selected.source}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onPrev()
                }}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-[11px] tracking-[0.16em] text-white"
              >
                ← {copy.boardPrev}
              </button>
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onNext()
                }}
                className="flex-1 rounded-xl border border-pitch-gold/40 bg-pitch-gold/15 py-2.5 text-[11px] tracking-[0.16em] text-pitch-gold"
              >
                {copy.boardNext} →
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'explore' && !selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-1 text-center">
          <p>{copy.boardHint}</p>
          <p className="text-white/55">{copy.boardNavigate}</p>
        </div>
      )}
    </>
  )
}
