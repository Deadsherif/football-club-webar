import { t } from '@/i18n'

interface DesktopGateProps {
  url: string
  onPreviewInteractive?: () => void
  onStartAR?: () => void
  onStartJourneyScan?: () => void
  onStartJourneyDirect?: () => void
}

export function DesktopGate({
  url,
  onPreviewInteractive,
  onStartAR,
  onStartJourneyScan,
  onStartJourneyDirect,
}: DesktopGateProps) {
  const copy = t()

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-8 text-center">
      <div className="pointer-events-none absolute inset-0 bg-pitch" />
      <div className="relative z-10 max-w-md">
        <p className="font-title text-3xl tracking-[0.2em] text-white">{copy.brand}</p>
        <p className="mt-2 text-sm tracking-[0.3em] text-pitch-gold">{copy.brandTagline}</p>
        <h1 className="mt-10 font-title text-2xl tracking-[0.12em] text-white">
          {copy.desktopTitle}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/65">{copy.desktopBody}</p>
        <p className="mt-6 break-all text-xs text-white/40">{url}</p>
        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/35">
          {copy.desktopHint}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {onStartJourneyDirect && (
            <button
              type="button"
              onClick={onStartJourneyDirect}
              className="min-h-12 rounded-full bg-gradient-to-br from-ahly-red to-ahly-crimson px-6 text-xs font-bold tracking-[0.14em] text-white"
            >
              {copy.journeyDirectCta}
            </button>
          )}
          {onStartJourneyScan && (
            <button
              type="button"
              onClick={onStartJourneyScan}
              className="min-h-12 rounded-full border border-pitch-gold/40 bg-pitch-gold/10 px-6 text-xs font-semibold tracking-[0.14em] text-pitch-gold"
            >
              {copy.journeyStartCta}
            </button>
          )}
          {onStartAR && (
            <button
              type="button"
              onClick={onStartAR}
              className="min-h-12 rounded-full border border-white/25 bg-black/35 px-6 text-xs font-bold tracking-[0.14em] text-white"
            >
              {copy.startExperience}
            </button>
          )}
          {onPreviewInteractive && (
            <button
              type="button"
              onClick={onPreviewInteractive}
              className="min-h-12 rounded-full border border-white/20 px-6 text-xs tracking-[0.16em] text-white/75"
            >
              {copy.continueInteractive}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
