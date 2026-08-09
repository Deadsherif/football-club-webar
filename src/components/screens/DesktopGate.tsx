import { t } from '@/i18n'

interface DesktopGateProps {
  url: string
  onPreviewInteractive?: () => void
  onStartAR?: () => void
}

export function DesktopGate({
  url,
  onPreviewInteractive,
  onStartAR,
}: DesktopGateProps) {
  const copy = t()
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`

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
        <img
          src={qr}
          alt="QR code"
          className="mx-auto mt-8 rounded-2xl border border-white/10 bg-white p-3"
          width={220}
          height={220}
        />
        <p className="mt-4 break-all text-xs text-white/40">{url}</p>
        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/35">
          {copy.desktopHint}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {onStartAR && (
            <button
              type="button"
              onClick={onStartAR}
              className="min-h-12 rounded-full bg-ahly-red px-6 text-xs font-bold tracking-[0.18em] text-white"
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
