import { t } from '@/i18n'

interface LoadingScreenProps {
  progress: number
  label: string
}

export function LoadingScreen({ progress, label }: LoadingScreenProps) {
  const copy = t()
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100)
  const statusText =
    label === 'camera' ? copy.requestingCamera : copy.loadingAssets

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-pitch-ink/95 px-8 text-center">
      <div className="mb-6 h-12 w-12 animate-spin rounded-full border-2 border-ahly-red/30 border-t-ahly-red" />
      <p className="font-title text-sm tracking-[0.22em] text-white">{copy.preparing}</p>
      <p className="mt-2 text-sm text-white/55">{statusText}</p>
      {label === 'assets' && (
        <div className="mt-8 w-full max-w-xs">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-ahly-red transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs tabular-nums text-white/40">{percent}%</p>
        </div>
      )}
    </div>
  )
}
