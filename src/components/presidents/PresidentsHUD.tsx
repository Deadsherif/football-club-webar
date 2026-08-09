import type { PresidentsPhase } from '@/ar/presidents/PresidentsController'
import type { President } from '@/data/presidents'
import { t } from '@/i18n'
import { audio } from '@/services/audioService'

interface PresidentsHUDProps {
  phase: PresidentsPhase
  yearLabel: string
  selected?: President
  showLegacyBanner: boolean
  onBack: () => void
  onPrev: () => void
  onNext: () => void
  onCloseDetail: () => void
}

export function PresidentsHUD({
  phase,
  yearLabel,
  selected,
  showLegacyBanner,
  onBack,
  onPrev,
  onNext,
  onCloseDetail,
}: PresidentsHUDProps) {
  const copy = t()
  const intro =
    phase === 'titles' ||
    phase === 'lights' ||
    phase === 'reveal' ||
    phase === 'tagline'

  return (
    <>
      {/* Broadcast year chip */}
      {(phase === 'explore' || phase === 'selected') && (
        <div className="pointer-events-none absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-full border border-white/15 bg-black/55 px-4 py-1.5 font-title text-sm tracking-[0.2em] text-pitch-gold backdrop-blur-md">
            {selected?.yearsLabel ?? yearLabel}
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
        {copy.presidentsBack}
      </button>

      {/* Cinematic intro titles */}
      {intro && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 px-6 text-center">
          {phase === 'titles' && (
            <div className="title-reveal title-reveal-active">
              <p className="font-title text-4xl tracking-[0.28em] text-white sm:text-5xl">
                {copy.brand}
              </p>
              <p className="mt-4 font-title text-sm tracking-[0.4em] text-pitch-gold">
                {copy.presidentsLeaders}
              </p>
            </div>
          )}
          {phase === 'tagline' && (
            <div className="title-reveal title-reveal-active space-y-4">
              <p className="font-title text-lg tracking-[0.28em] text-pitch-gold sm:text-xl">
                {copy.presidentsCentury}
              </p>
              <p className="font-title text-sm tracking-[0.35em] text-white/80">
                {copy.presidentsExplore}
              </p>
            </div>
          )}
          {(phase === 'lights' || phase === 'reveal') && (
            <p className="font-title text-xs tracking-[0.3em] text-white/50">
              {copy.presidentsEntering}
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

      {/* Selected info panel */}
      {selected && phase === 'selected' && (
        <div className="absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-h-[42dvh] max-w-lg overflow-y-auto rounded-3xl border border-white/12 bg-[#0a0506]/88 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-title text-[10px] tracking-[0.28em] text-pitch-gold">
                  {copy.presidentsOf}
                </p>
                <h2 className="mt-1 font-title text-xl tracking-[0.06em] text-white">
                  {selected.name}
                </h2>
                {selected.arabicName && (
                  <p className="mt-1 text-sm text-white/55">{selected.arabicName}</p>
                )}
                <p className="mt-2 text-xs tracking-[0.16em] text-white/70">
                  {selected.yearsLabel}
                </p>
                {selected.endYear === null && (
                  <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-ahly-red">
                    {copy.presidentsCurrent}
                  </p>
                )}
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

            <p className="mt-4 text-xs leading-relaxed text-white/75">
              {selected.description}
            </p>

            {selected.achievements && selected.achievements.length > 0 && (
              <div className="mt-4">
                <p className="font-title text-[10px] tracking-[0.22em] text-pitch-gold">
                  {copy.presidentsKeyMoments}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {selected.achievements.map((a) => (
                    <li key={a} className="text-xs text-white/65">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.source && (
              <p className="mt-4 text-[9px] text-white/30">Source: {selected.source}</p>
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
                ← {copy.presidentsPrev}
              </button>
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onNext()
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-[10px] tracking-[0.2em] text-white/80"
              >
                {copy.presidentsNext} →
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'explore' && !selected && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 text-center text-[10px] tracking-[0.22em] text-white/40">
          {copy.presidentsHint}
        </p>
      )}
    </>
  )
}
