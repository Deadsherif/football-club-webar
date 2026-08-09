import { t } from '@/i18n'
import { audio } from '@/services/audioService'
import { analytics } from '@/services/analyticsService'

interface AskAlAhlyButtonProps {
  onClick: () => void
}

export function AskAlAhlyButton({ onClick }: AskAlAhlyButtonProps) {
  const copy = t()
  return (
    <button
      type="button"
      onClick={() => {
        void audio.play('ui')
        analytics.aiOpened()
        onClick()
      }}
      className="absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 rounded-full border border-pitch-gold/40 bg-black/55 px-4 py-3 text-[10px] font-semibold tracking-[0.18em] text-pitch-gold backdrop-blur-md"
    >
      {copy.askAlAhly}
    </button>
  )
}
