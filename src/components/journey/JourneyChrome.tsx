import { useState } from 'react'
import { getLocale, t } from '@/i18n'
import {
  journeyChapters,
  journeySteps,
  type JourneyChapter,
} from '@/data/journey'
import {
  useJourney,
  type JourneyDwellSpeed,
} from '@/journey/JourneyContext'
import { audio } from '@/services/audioService'

const CHAPTER_LABEL: Record<JourneyChapter, keyof ReturnType<typeof t>> = {
  presidents: 'journeyChapterPresidents',
  trophies: 'journeyChapterTrophies',
  board: 'journeyChapterBoard',
  'red-castle': 'journeyChapterRedCastle',
  complete: 'journeyChapterComplete',
}

/**
 * Persistent cinematic chrome — keeps cards visible, with an Edit View panel.
 */
export function JourneyChrome() {
  const journey = useJourney()
  const copy = t()
  const locale = getLocale()
  const [viewOpen, setViewOpen] = useState(false)

  if (!journey.active || !journey.step) return null

  const step = journey.step
  const title = locale === 'ar' ? step.titleAr : step.titleEn
  const summary =
    locale === 'ar' ? (step.summaryAr ?? step.summaryEn) : step.summaryEn
  const countLabel =
    locale === 'ar'
      ? (step.countLabelAr ?? step.countLabelEn)
      : step.countLabelEn
  const chapterLabel = copy[CHAPTER_LABEL[step.chapter]] as string
  const { view } = journey
  const showStoryCard =
    step.chapter !== 'complete' &&
    view.showCaptions &&
    Boolean(summary || title)

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-ahly-red via-pitch-gold to-ahly-red transition-[width] duration-500"
          style={{ width: `${Math.max(2, journey.progress * 100)}%` }}
        />
      </div>

      <div className="pointer-events-auto absolute top-[max(0.75rem,env(safe-area-inset-top))] inset-x-0 flex items-start justify-between gap-2 px-3">
        <button
          type="button"
          onClick={journey.exit}
          className="rounded-full border border-white/20 bg-black/60 px-3 py-2 text-[10px] font-semibold tracking-[0.18em] text-white/80 backdrop-blur-md"
        >
          {copy.journeyExit}
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="font-title text-[10px] tracking-[0.28em] text-pitch-gold">
            {chapterLabel}
          </p>
          <p className="mt-1 truncate font-title text-xs tracking-[0.14em] text-white/85">
            {step.yearLabel}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              void audio.play('ui')
              setViewOpen((v) => !v)
            }}
            className={`rounded-full border px-3 py-2 text-[10px] font-semibold tracking-[0.16em] backdrop-blur-md ${
              viewOpen
                ? 'border-pitch-gold/50 bg-pitch-gold/20 text-pitch-gold'
                : 'border-white/20 bg-black/60 text-white/80'
            }`}
          >
            {copy.journeyEditView}
          </button>
          <div className="rounded-full border border-white/15 bg-black/55 px-3 py-2 text-[10px] tracking-[0.16em] text-white/70 backdrop-blur-md">
            {journey.stepIndex + 1}/{journey.total}
          </div>
        </div>
      </div>

      {view.showChapterBar && (
        <div className="pointer-events-auto absolute top-[max(4.2rem,calc(env(safe-area-inset-top)+3.4rem))] inset-x-0 overflow-x-auto px-3 no-scrollbar">
          <div className="mx-auto flex w-max max-w-none items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2 py-1.5 backdrop-blur-md">
            {journeyChapters
              .filter((c) => c !== 'complete')
              .map((chapter) => {
                const active = step.chapter === chapter
                const label = copy[CHAPTER_LABEL[chapter]] as string
                return (
                  <button
                    key={chapter}
                    type="button"
                    onClick={() => journey.seekChapter(chapter)}
                    className={`rounded-full px-2.5 py-1 text-[9px] tracking-[0.14em] transition ${
                      active
                        ? 'bg-ahly-red text-white shadow-[0_0_24px_rgba(227,6,19,0.45)]'
                        : 'text-white/45 hover:text-white/75'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* Edit View panel */}
      {viewOpen && (
        <div className="pointer-events-auto absolute top-[max(7rem,calc(env(safe-area-inset-top)+6.2rem))] right-3 z-[70] w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-white/15 bg-[#0a0506]/92 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <p className="font-title text-[10px] tracking-[0.22em] text-pitch-gold">
            {copy.journeyEditView}
          </p>
          <div className="mt-3 space-y-2.5">
            <ToggleRow
              label={copy.journeyOptCaptions}
              on={view.showCaptions}
              onToggle={() =>
                journey.setView({ showCaptions: !view.showCaptions })
              }
            />
            <ToggleRow
              label={copy.journeyOptCompact}
              on={view.compactCaptions}
              onToggle={() =>
                journey.setView({ compactCaptions: !view.compactCaptions })
              }
            />
            <ToggleRow
              label={copy.journeyOptFreeLook}
              on={view.freeLook}
              onToggle={() => journey.setView({ freeLook: !view.freeLook })}
            />
            <ToggleRow
              label={copy.journeyOptChapterBar}
              on={view.showChapterBar}
              onToggle={() =>
                journey.setView({ showChapterBar: !view.showChapterBar })
              }
            />
            <div>
              <p className="text-[10px] tracking-[0.14em] text-white/55">
                {copy.journeyOptSpeed}
              </p>
              <div className="mt-1.5 flex gap-1">
                {(['slow', 'normal', 'fast'] as JourneyDwellSpeed[]).map(
                  (speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        void audio.play('ui')
                        journey.setView({ dwellSpeed: speed })
                      }}
                      className={`flex-1 rounded-full px-2 py-1.5 text-[9px] tracking-[0.12em] ${
                        view.dwellSpeed === speed
                          ? 'bg-ahly-red text-white'
                          : 'bg-white/10 text-white/55'
                      }`}
                    >
                      {speed === 'slow'
                        ? copy.journeySpeedSlow
                        : speed === 'fast'
                          ? copy.journeySpeedFast
                          : copy.journeySpeedNormal}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {step.chapter === 'complete' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 via-[#1a0808]/75 to-black/90 px-6 text-center">
          <p className="font-title text-[10px] tracking-[0.4em] text-pitch-gold">
            {copy.brand}
          </p>
          <h1 className="mt-4 max-w-lg font-title text-3xl tracking-[0.12em] text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            {summary}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={journey.start}
              className="min-h-12 rounded-full bg-ahly-red px-8 py-3 text-xs font-bold tracking-[0.2em] text-white"
            >
              {copy.journeyReplay}
            </button>
            <button
              type="button"
              onClick={journey.exit}
              className="min-h-12 rounded-full border border-white/25 bg-black/40 px-8 py-3 text-xs font-semibold tracking-[0.18em] text-white/85"
            >
              {copy.journeyExit}
            </button>
          </div>
        </div>
      )}

      {/* Story description — left on presidents (card is right); never steal taps */}
      {showStoryCard && (
        <div
          className={`pointer-events-none absolute z-[65] w-[min(20rem,calc(100vw-1.5rem))] ${
            step.chapter === 'presidents' ? 'left-3' : 'right-3'
          } ${
            viewOpen
              ? 'top-[max(19rem,calc(env(safe-area-inset-top)+17.5rem))]'
              : view.showChapterBar
                ? 'top-[max(7rem,calc(env(safe-area-inset-top)+5.8rem))]'
                : 'top-[max(4.4rem,calc(env(safe-area-inset-top)+3.6rem))]'
          }`}
        >
          <div
            className={`overflow-y-auto rounded-2xl border border-white/12 bg-[#0a0506]/78 text-start shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md ${
              view.compactCaptions
                ? 'max-h-[22dvh] px-3 py-2.5'
                : 'max-h-[34dvh] p-3.5'
            }`}
          >
            <p className="font-title text-[9px] tracking-[0.24em] text-pitch-gold">
              {chapterLabel}
            </p>
            <h2
              className={`mt-0.5 font-title tracking-[0.06em] text-white ${
                view.compactCaptions ? 'text-sm' : 'text-base'
              }`}
            >
              {title}
            </h2>
            {countLabel && (
              <p className="mt-1.5 inline-flex rounded-full border border-pitch-gold/40 bg-pitch-gold/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-pitch-gold">
                {countLabel}
              </p>
            )}
            {summary && !view.compactCaptions && (
              <p className="mt-2 text-xs leading-relaxed text-white/70">{summary}</p>
            )}
            {summary && view.compactCaptions && (
              <p className="mt-1 line-clamp-4 text-[11px] leading-snug text-white/65">
                {summary}
              </p>
            )}
          </div>
        </div>
      )}

      {step.chapter !== 'complete' && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-[max(0.85rem,env(safe-area-inset-bottom))] px-3">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-2 rounded-full border border-white/12 bg-black/70 px-2 py-2 backdrop-blur-xl">
            <button
              type="button"
              onClick={journey.prev}
              disabled={journey.stepIndex <= 0}
              className="rounded-full px-4 py-2.5 text-[10px] tracking-[0.18em] text-white/80 disabled:opacity-30"
            >
              {copy.journeyPrev}
            </button>
            <button
              type="button"
              onClick={journey.playing ? journey.pause : journey.resume}
              className="rounded-full border border-pitch-gold/40 bg-pitch-gold/15 px-5 py-2.5 text-[10px] font-semibold tracking-[0.2em] text-pitch-gold"
            >
              {journey.playing ? copy.journeyPause : copy.journeyResume}
            </button>
            <button
              type="button"
              onClick={journey.next}
              className="rounded-full px-4 py-2.5 text-[10px] tracking-[0.18em] text-white/80"
            >
              {copy.journeyNext}
            </button>
          </div>

          <p className="mx-auto mt-1.5 max-w-lg text-center text-[9px] tracking-[0.12em] text-white/35">
            {copy.journeyKeysHint}
          </p>

          <div className="mx-auto mt-2 max-w-lg overflow-x-auto pb-1 no-scrollbar">
            <div className="flex w-max gap-1 px-1">
              {journeySteps
                .map((s, index) => ({ s, index }))
                .filter(({ s }) => s.chapter === step.chapter)
                .map(({ s, index }) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => journey.seek(index)}
                    className={`h-1.5 w-4 rounded-full transition ${
                      index === journey.stepIndex
                        ? 'bg-pitch-gold'
                        : index < journey.stepIndex
                          ? 'bg-ahly-red/70'
                          : 'bg-white/20'
                    }`}
                    aria-label={s.titleEn}
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void audio.play('ui')
        onToggle()
      }}
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-start"
    >
      <span className="text-[10px] tracking-[0.12em] text-white/75">{label}</span>
      <span
        className={`h-5 w-9 rounded-full p-0.5 transition ${
          on ? 'bg-ahly-red' : 'bg-white/20'
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition ${
            on ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  )
}
