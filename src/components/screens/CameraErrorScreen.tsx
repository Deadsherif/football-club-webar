import { t } from '@/i18n'
import type { CameraErrorKind } from '@/types/ar'

interface CameraErrorScreenProps {
  kind: CameraErrorKind
  onRetry: () => void
  onFallback: () => void
  onBack: () => void
}

function messageFor(kind: CameraErrorKind): string {
  const copy = t()
  switch (kind) {
    case 'denied':
      return copy.cameraDenied
    case 'unavailable':
      return copy.cameraUnavailable
    case 'insecure':
      return copy.cameraInsecure
    default:
      return copy.cameraUnknown
  }
}

export function CameraErrorScreen({
  kind,
  onRetry,
  onFallback,
  onBack,
}: CameraErrorScreenProps) {
  const copy = t()
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-pitch-ink px-8 text-center">
      <h1 className="font-title text-xl tracking-[0.12em] text-white">
        {copy.cameraErrorTitle}
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
        {messageFor(kind)}
      </p>
      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="min-h-12 rounded-full bg-ahly-red px-6 py-3 text-sm font-bold tracking-[0.16em] text-white"
        >
          {copy.retry}
        </button>
        <button
          type="button"
          onClick={onFallback}
          className="min-h-12 rounded-full border border-white/20 px-6 py-3 text-sm tracking-[0.12em] text-white/80"
        >
          {copy.continueInteractive}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-10 text-xs tracking-[0.2em] text-white/45"
        >
          {copy.back}
        </button>
      </div>
    </div>
  )
}
