import { t } from '@/i18n'

interface LandingScreenProps {
  onStart: () => void
  crestSrc: string
}

export function LandingScreen({ onStart, crestSrc }: LandingScreenProps) {
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
              className="h-28 w-28 object-contain sm:h-36 sm:w-36"
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

        <button
          type="button"
          onClick={onStart}
          className="mt-10 min-h-14 w-full max-w-xs rounded-full bg-ahly-red px-8 py-4 text-sm font-bold tracking-[0.2em] text-white shadow-[0_16px_48px_rgba(227,6,19,0.4)] transition active:scale-[0.98]"
        >
          {copy.startExperience}
        </button>

        <p className="mt-5 text-xs tracking-[0.18em] text-white/40 uppercase">
          {copy.immersiveHint}
        </p>
      </main>
    </div>
  )
}
