import { useState } from 'react'
import { t } from '@/i18n'
import { historyMilestones } from '@/data/history'
import { trophies } from '@/data/trophies'
import { legends } from '@/data/legends'
import { futureConcepts } from '@/data/future'
import type { ExploreSection } from '@/types/ar'
import { audio } from '@/services/audioService'

interface ExplorePanelProps {
  section: Exclude<ExploreSection, null>
  onClose: () => void
  onEnterPresidents?: () => void
}

export function ExplorePanel({
  section,
  onClose,
  onEnterPresidents,
}: ExplorePanelProps) {
  const copy = t()
  const [selectedTrophy, setSelectedTrophy] = useState<string | null>(null)

  const title =
    section === 'history'
      ? copy.historyTitle
      : section === 'trophies'
        ? copy.trophiesTitle
        : section === 'legends'
          ? copy.legendsTitle
          : copy.futureTitle

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-[2px]">
      <div className="max-h-[72dvh] w-full max-w-md overflow-hidden rounded-3xl border border-white/12 bg-[#0c0708]/92 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-title text-sm tracking-[0.22em] text-white">{title}</h2>
          <button
            type="button"
            onClick={() => {
              void audio.play('ui')
              onClose()
            }}
            className="text-[11px] tracking-[0.16em] text-white/50"
          >
            {copy.close}
          </button>
        </div>

        <div className="max-h-[calc(72dvh-3.5rem)] overflow-y-auto px-5 py-4">
          <p className="mb-4 text-[10px] uppercase tracking-[0.16em] text-white/35">
            {copy.placeholderNote}
          </p>

          {section === 'history' && (
            <div className="space-y-5">
              {onEnterPresidents && (
                <button
                  type="button"
                  onClick={() => {
                    void audio.play('ui')
                    onEnterPresidents()
                  }}
                  className="w-full rounded-2xl border border-pitch-gold/40 bg-gradient-to-br from-ahly-red/30 to-black/40 px-4 py-5 text-start"
                >
                  <p className="font-title text-sm tracking-[0.22em] text-pitch-gold">
                    {copy.presidentsEnter}
                  </p>
                  <p className="mt-2 text-xs text-white/65">{copy.presidentsEnterHint}</p>
                </button>
              )}

              <ol className="relative space-y-5 border-s border-ahly-red/40 ps-5">
                {historyMilestones.map((m) => (
                  <li key={m.id} className="relative">
                    <span className="absolute -start-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-pitch-gold" />
                    <p className="font-title text-lg tracking-[0.12em] text-pitch-gold">
                      {m.year}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{m.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">
                      {m.summary}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {section === 'trophies' && (
            <div className="space-y-3">
              {trophies.map((trophy) => {
                const active = selectedTrophy === trophy.id
                return (
                  <button
                    key={trophy.id}
                    type="button"
                    onClick={() => {
                      void audio.play('ui')
                      setSelectedTrophy(active ? null : trophy.id)
                    }}
                    className={`w-full rounded-2xl border px-4 py-3 text-start transition ${
                      active
                        ? 'border-pitch-gold/50 bg-pitch-gold/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{trophy.name}</p>
                    <p className="mt-1 text-[11px] tracking-[0.12em] text-white/45">
                      {trophy.competition} · {trophy.year}
                    </p>
                    {active && (
                      <p className="mt-2 text-xs leading-relaxed text-white/65">
                        {trophy.description}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {section === 'legends' && (
            <div className="space-y-3">
              {legends.map((legend) => (
                <div
                  key={legend.id}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <img
                    src={legend.imageSrc}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{legend.name}</p>
                    <p className="text-[11px] text-white/45">
                      {legend.position} · {legend.era}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {legend.achievements.map((a) => (
                        <li key={a} className="text-xs text-white/60">
                          · {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'future' && (
            <div className="grid gap-3">
              {futureConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-transparent p-4"
                  style={{ boxShadow: `inset 0 0 0 1px ${concept.accent}22` }}
                >
                  <p
                    className="font-title text-xs tracking-[0.2em]"
                    style={{ color: concept.accent }}
                  >
                    {concept.title}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/65">
                    {concept.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
