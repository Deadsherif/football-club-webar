import type { LegendPlayer } from '@/data/players'
import type { HistoricalSquad } from '@/data/squads'
import { historicalSquads } from '@/data/squads'
import { t } from '@/i18n'
import { audio } from '@/services/audioService'

interface LegendsHUDProps {
  squad: HistoricalSquad
  selected: LegendPlayer | null
  onBack: () => void
  onSelectSquad: (id: string) => void
  onPreviousSquad: () => void
  onNextSquad: () => void
  onPreviousPlayer: () => void
  onNextPlayer: () => void
  onClosePlayer: () => void
}

export function LegendsHUD({
  squad,
  selected,
  onBack,
  onSelectSquad,
  onPreviousSquad,
  onNextSquad,
  onPreviousPlayer,
  onNextPlayer,
  onClosePlayer,
}: LegendsHUDProps) {
  const copy = t()

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void audio.play('ui')
          onBack()
        }}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-40 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-white backdrop-blur-md"
      >
        {copy.legendsBack}
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-20 px-20 text-center">
        <p className="font-title text-sm tracking-[0.28em] text-pitch-gold">
          {copy.legendsStadiumTitle}
        </p>
        <p className="mt-1 font-title text-xs tracking-[0.18em] text-white/90">
          {squad.eraName}
        </p>
        <p className="mt-1 text-[10px] tracking-[0.18em] text-white/55">
          {squad.id === 'all-time-legends'
            ? copy.allTimeLegends
            : squad.formation
              ? `${squad.formation} · ${copy.featuredLegends}`
              : copy.featuredLegends}
        </p>
        {squad.achievements?.[0] && (
          <p className="mt-1 text-[10px] tracking-[0.12em] text-white/75">
            {squad.achievements[0]}
          </p>
        )}
      </div>

      <div className="absolute inset-x-0 top-[max(4.5rem,env(safe-area-inset-top)+3.5rem)] z-30 overflow-x-auto px-4 [scrollbar-width:none]">
        <div className="mx-auto flex w-max gap-2 pb-1">
          {historicalSquads.map((era) => {
            const active = era.id === squad.id
            return (
              <button
                key={era.id}
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onSelectSquad(era.id)
                }}
                className={`rounded-full border px-3 py-2 text-[10px] font-semibold tracking-[0.16em] transition ${
                  active
                    ? 'border-pitch-gold bg-pitch-gold/20 text-pitch-gold'
                    : 'border-white/15 bg-black/45 text-white/70'
                }`}
              >
                {era.id === 'all-time-legends'
                  ? copy.allTimeLegends
                  : era.endYear
                    ? `${era.year}–${String(era.endYear).slice(-2)}`
                    : era.year}
              </button>
            )
          })}
        </div>
      </div>

      {!selected && (
        <div className="absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-20 flex justify-center gap-2 px-4">
          <button
            type="button"
            onClick={() => {
              void audio.play('ui')
              onPreviousSquad()
            }}
            className="rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[10px] tracking-[0.16em] text-white/75"
          >
            ← {copy.previousEra}
          </button>
          <button
            type="button"
            onClick={() => {
              void audio.play('ui')
              onNextSquad()
            }}
            className="rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[10px] tracking-[0.16em] text-white/75"
          >
            {copy.nextEra} →
          </button>
        </div>
      )}

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-h-[min(40dvh,340px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/12 bg-[#0a0506]/88 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:max-h-[46dvh] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-title text-[10px] tracking-[0.28em] text-pitch-gold">
                  {copy.legendBadge}
                </p>
                <h2 className="mt-1 font-title text-lg tracking-[0.06em] text-white sm:text-xl">
                  {selected.name}
                </h2>
                {selected.arabicName && (
                  <p className="mt-1 text-sm text-white/55">{selected.arabicName}</p>
                )}
                <p className="mt-2 text-xs tracking-[0.16em] text-white/70">
                  {selected.position ?? copy.positionNotVerified} · {selected.era}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onClosePlayer()
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
                  {copy.legendsAchievements}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {selected.achievements.map((achievement) => (
                    <li key={achievement} className="text-xs text-white/65">
                      • {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 break-all text-[9px] text-white/30">
              {copy.sourceLabel}: {selected.source}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onPreviousPlayer()
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-[10px] tracking-[0.2em] text-white/80"
              >
                ← {copy.previousPlayer}
              </button>
              <button
                type="button"
                onClick={() => {
                  void audio.play('ui')
                  onNextPlayer()
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-[10px] tracking-[0.2em] text-white/80"
              >
                {copy.nextPlayer} →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
