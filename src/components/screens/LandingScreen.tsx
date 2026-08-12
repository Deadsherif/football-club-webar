import { t } from '@/i18n'

interface LandingScreenProps {
  onStartAr: () => void
  onStartJourneyScan: () => void
  onContinueInteractive?: () => void
  crestSrc: string
}

export function LandingScreen({
  onStartAr,
  onStartJourneyScan,
  onContinueInteractive,
  crestSrc,
}: LandingScreenProps) {
  const copy = t()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-pitch" />
      <div className="pointer-events-none absolute inset-0 bg-vignette" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center">
        <div className="crest-float mb-8">
          <div className="rounded-full border border-white/10 bg-black/40 p-5 shadow-[0_0_80px_rgba(227,6,19,0.28)]">
            <img
              src={crestSrc}
              alt={copy.brand}
              className="h-20 w-20 object-contain sm:h-24 sm:w-24"
              draggable={false}
            />
          </div>
        </div>

        <h1 className="font-title text-[clamp(2.4rem,10vw,4.2rem)] font-bold tracking-[0.2em] text-white">
          {copy.brand}
        </h1>
        <p className="mt-3 font-title text-sm tracking-[0.35em] text-pitch-gold sm:text-base">
          {copy.brandTagline}
        </p>
        <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/70 sm:text-base">
          {copy.landingSubtitle}
        </p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={onStartJourneyScan}
            className="min-h-14 w-full rounded-full bg-gradient-to-br from-ahly-red to-ahly-crimson px-8 py-4 text-sm font-bold tracking-[0.14em] text-white shadow-[0_16px_48px_rgba(227,6,19,0.45)] transition active:scale-[0.98]"
          >
            {copy.journeyStartCta}
          </button>

          <button
            type="button"
            onClick={onStartAr}
            className="min-h-12 w-full rounded-full border border-white/25 bg-black/40 px-8 py-3 text-xs font-semibold tracking-[0.14em] text-white/90 backdrop-blur-sm transition active:scale-[0.98]"
          >
            {copy.startExperience}
          </button>

          {onContinueInteractive && (
            <button
              type="button"
              onClick={onContinueInteractive}
              className="min-h-12 w-full rounded-full border border-white/15 bg-black/25 px-6 py-3 text-[11px] font-semibold tracking-[0.16em] text-white/70 backdrop-blur-sm transition active:scale-[0.98]"
            >
              {copy.continueInteractive}
            </button>
          )}
        </div>

        <p className="mt-4 max-w-xs text-[11px] leading-relaxed tracking-[0.04em] text-white/45">
          {copy.journeyStartHint}
        </p>

        <p className="mt-5 text-xs tracking-[0.18em] text-white/40 uppercase">
          {copy.scanCrestArHint}
        </p>
      </main>
    </div>
  )
}
