import { useEffect } from 'react'
import type { CinematicPhase } from '@/types/ar'
import { t } from '@/i18n'

interface CinematicTitlesProps {
  phase: CinematicPhase
}

export function CinematicTitles({ phase }: CinematicTitlesProps) {
  const copy = t()
  const showLegacy = phase === 'legacy'
  const showTitle = phase === 'title'

  useEffect(() => {
    if (phase === 'title' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(40)
      } catch {
        /* unsupported */
      }
    }
  }, [phase])

  if (!showLegacy && !showTitle) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center px-6">
      {showLegacy && !showTitle && (
        <p className="title-reveal title-reveal-active font-title text-center text-[clamp(1.1rem,5vw,1.8rem)] tracking-[0.28em] text-pitch-gold">
          {copy.legacyContinues}
        </p>
      )}

      {showTitle && (
        <div className={`title-reveal text-center ${showTitle ? 'title-reveal-active' : ''}`}>
          <p className="font-title text-[clamp(0.95rem,4vw,1.25rem)] tracking-[0.35em] text-white/75">
            {copy.twelfthPlayerLine1}
          </p>
          <p className="mt-2 font-title text-[clamp(1.8rem,8vw,3.2rem)] font-bold tracking-[0.12em] text-pitch-gold drop-shadow-[0_2px_28px_rgba(212,175,55,0.4)]">
            {copy.twelfthPlayerLine2}
          </p>
          <div className="mx-auto mt-4 h-px w-20 bg-gradient-to-r from-transparent via-pitch-gold to-transparent" />
          <p className="mt-4 text-sm text-white/70">{copy.twelfthPlayerSub}</p>
        </div>
      )}
    </div>
  )
}
