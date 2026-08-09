import type { TrackingState } from '@/types/ar'
import { t } from '@/i18n'

interface ScannerOverlayProps {
  trackingState: TrackingState
}

export function ScannerOverlay({ trackingState }: ScannerOverlayProps) {
  const copy = t()
  const detected = trackingState === 'tracking'
  const label = detected
    ? copy.crestDetected
    : trackingState === 'lost'
      ? copy.targetLost
      : copy.searching

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
      <div className="relative h-64 w-64 max-w-[70vw]">
        <span className="scan-corner scan-corner-tl" />
        <span className="scan-corner scan-corner-tr" />
        <span className="scan-corner scan-corner-bl" />
        <span className="scan-corner scan-corner-br" />
        {!detected && (
          <div className="scan-line absolute inset-x-4 top-0 h-0.5 bg-gradient-to-r from-transparent via-ahly-red to-transparent" />
        )}
      </div>
      <div
        className={`mt-8 rounded-full border px-5 py-2.5 text-xs font-semibold tracking-[0.18em] backdrop-blur-md ${
          detected
            ? 'border-ahly-red/50 bg-ahly-red/25 text-white'
            : 'border-white/20 bg-black/55 text-white/90'
        }`}
      >
        {label}
      </div>
    </div>
  )
}
