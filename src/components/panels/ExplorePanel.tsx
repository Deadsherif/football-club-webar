import { useState } from 'react'
import { t } from '@/i18n'
import { historyMilestones } from '@/data/history'
import { trophies } from '@/data/trophies'
import { futureConcepts } from '@/data/future'
import { boardMembers, redCastleHighlights } from '@/data/boardAndCastle'
import { redCastleMembers } from '@/data/redCastleMembers'
import type { ExploreSection } from '@/types/ar'
import { audio } from '@/services/audioService'
import { publicUrl } from '@/utils/publicUrl'

interface ExplorePanelProps {
  section: Exclude<ExploreSection, null>
  onClose: () => void
  onEnterPresidents?: () => void
  onEnterTrophies?: () => void
  onEnterBoard?: () => void
  onEnterRedCastle?: () => void
}

export function ExplorePanel({
  section,
  onClose,
  onEnterPresidents,
  onEnterTrophies,
  onEnterBoard,
  onEnterRedCastle,
}: ExplorePanelProps) {
  const copy = t()
  const [selectedTrophy, setSelectedTrophy] = useState<string | null>(null)

  const title =
    section === 'history'
      ? copy.historyTitle
      : section === 'trophies'
        ? copy.trophiesTitle
        : section === 'board'
          ? copy.boardTitleAr
          : section === 'red-castle'
            ? copy.redCastleTitleAr
            : copy.futureTitle

  const subtitle =
    section === 'board'
      ? copy.boardTitle
      : section === 'red-castle'
        ? copy.redCastleTitle
        : null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 backdrop-blur-[2px]">
      <div className="max-h-[72dvh] w-full max-w-md overflow-hidden rounded-3xl border border-white/12 bg-[#0c0708]/92 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-title text-sm tracking-[0.18em] text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[10px] tracking-[0.16em] text-white/45">
                {subtitle}
              </p>
            )}
          </div>
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
            <div className="space-y-3" dir="rtl">
              {onEnterTrophies && (
                <button
                  type="button"
                  onClick={() => {
                    void audio.play('ui')
                    onEnterTrophies()
                  }}
                  className="w-full rounded-2xl border border-pitch-gold/40 bg-gradient-to-br from-ahly-red/30 to-black/40 px-4 py-5 text-start"
                >
                  <p className="font-title text-sm tracking-[0.22em] text-pitch-gold">
                    {copy.trophiesEnter}
                  </p>
                  <p className="mt-2 text-xs text-white/65">{copy.trophiesEnterHint}</p>
                </button>
              )}

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
                    <p className="text-sm font-semibold text-white">{trophy.nameAr}</p>
                    <p className="mt-1 text-[11px] tracking-[0.12em] text-white/45">
                      {trophy.categoryAr} · {trophy.officialTitles}
                    </p>
                    {active && (
                      <p className="mt-2 text-xs leading-relaxed text-white/65">
                        {trophy.summaryAr}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {section === 'board' && (
            <div className="space-y-4" dir="rtl">
              {onEnterBoard && (
                <button
                  type="button"
                  onClick={() => {
                    void audio.play('ui')
                    onEnterBoard()
                  }}
                  className="w-full rounded-2xl border border-pitch-gold/40 bg-gradient-to-br from-ahly-red/30 to-black/40 px-4 py-5 text-start"
                >
                  <p className="font-title text-sm tracking-[0.22em] text-pitch-gold">
                    {copy.boardEnter}
                  </p>
                  <p className="mt-2 text-xs text-white/65">{copy.boardEnterHint}</p>
                </button>
              )}

              <div className="rounded-2xl border border-pitch-gold/30 bg-ahly-red/15 px-4 py-4 text-start">
                <p className="text-sm font-semibold text-white">{copy.boardTitleAr}</p>
                <p className="mt-1 text-[11px] tracking-[0.14em] text-white/45">
                  {copy.boardTitle}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/65">
                  {copy.boardIntroAr}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  {copy.boardIntro}
                </p>
              </div>

              {boardMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-start"
                >
                  <img
                    src={publicUrl(member.portrait)}
                    alt={member.name}
                    className="h-16 w-12 shrink-0 rounded-lg object-cover object-top"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {member.arabicName ?? member.name}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">{member.name}</p>
                    <p className="mt-2 text-xs text-pitch-gold">{member.roleAr}</p>
                    <p className="mt-1 text-[10px] tracking-[0.12em] text-white/40">
                      {member.roleEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'red-castle' && (
            <div className="space-y-4" dir="rtl">
              {onEnterRedCastle && (
                <button
                  type="button"
                  onClick={() => {
                    void audio.play('ui')
                    onEnterRedCastle()
                  }}
                  className="w-full rounded-2xl border border-pitch-gold/40 bg-gradient-to-br from-ahly-red/30 to-black/40 px-4 py-5 text-start"
                >
                  <p className="font-title text-sm tracking-[0.22em] text-pitch-gold">
                    {copy.redCastleEnter}
                  </p>
                  <p className="mt-2 text-xs text-white/65">
                    {copy.redCastleEnterHint}
                  </p>
                </button>
              )}

              <div className="rounded-2xl border border-pitch-gold/30 bg-gradient-to-br from-ahly-red/35 to-black/40 px-4 py-5 text-start">
                <p className="font-title text-base tracking-[0.14em] text-pitch-gold">
                  {copy.redCastleTitleAr}
                </p>
                <p className="mt-1 text-[11px] tracking-[0.16em] text-white/50">
                  {copy.redCastleTitle}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  {copy.redCastleIntroAr}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  {copy.redCastleIntro}
                </p>
              </div>

              {redCastleMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-start"
                >
                  <img
                    src={publicUrl(member.portrait)}
                    alt={member.name}
                    className="h-16 w-12 shrink-0 rounded-lg object-cover object-top"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {member.arabicName ?? member.name}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">{member.name}</p>
                    <p className="mt-2 text-xs text-pitch-gold">{member.roleAr}</p>
                    <p className="mt-1 text-[10px] tracking-[0.12em] text-white/40">
                      {member.roleEn}
                    </p>
                  </div>
                </div>
              ))}

              {redCastleHighlights.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-start"
                >
                  <p className="text-sm font-semibold text-white">{item.titleAr}</p>
                  <p className="mt-1 text-[11px] tracking-[0.14em] text-white/45">
                    {item.titleEn}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-white/65">
                    {item.summaryAr}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">
                    {item.summaryEn}
                  </p>
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
