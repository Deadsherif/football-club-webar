import { t } from '@/i18n'
import { audio } from '@/services/audioService'

interface CabinetCloseButtonProps {
  visible: boolean
  onClose: () => void
  /** Journey chrome occupies the top bar — sit just below it. */
  journey?: boolean
}

/**
 * Returns from focused card/trophy to the full cabinet (model + flying items).
 */
export function CabinetCloseButton({
  visible,
  onClose,
  journey = false,
}: CabinetCloseButtonProps) {
  const copy = t()
  if (!visible) return null

  return (
    <button
      type="button"
      aria-label={copy.close}
      title={copy.close}
      onClick={() => {
        void audio.play('ui')
        onClose()
      }}
      className={`pointer-events-auto absolute z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/70 text-2xl leading-none text-white/90 backdrop-blur-md ${
        journey
          ? 'top-[max(4.4rem,calc(env(safe-area-inset-top)+3.6rem))] right-[max(0.75rem,env(safe-area-inset-right))]'
          : 'top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))]'
      }`}
    >
      ×
    </button>
  )
}
