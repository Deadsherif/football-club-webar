import { t } from '@/i18n'

interface UnsupportedScreenProps {
  onContinue: () => void
  onRetry?: () => void
}

export function UnsupportedScreen({ onContinue, onRetry }: UnsupportedScreenProps) {
  const copy = t()
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-8 text-center">
      <div className="pointer-events-none absolute inset-0 bg-pitch" />
      <div className="relative z-10 max-w-sm">
        <h1 className="font-title text-xl tracking-[0.14em] text-white">
          {copy.unsupportedTitle}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/65">{copy.unsupportedBody}</p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-10 min-h-12 w-full rounded-full bg-ahly-red px-6 py-3 text-sm font-bold tracking-[0.16em] text-white"
        >
          {copy.continueInteractive}
        </button>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-12 w-full rounded-full border border-white/20 px-6 py-3 text-sm tracking-[0.16em] text-white/70"
          >
            {copy.retry}
          </button>
        )}
      </div>
    </div>
  )
}
