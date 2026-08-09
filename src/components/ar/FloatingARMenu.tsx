import { t } from '@/i18n'
import type { ExploreSection } from '@/types/ar'
import { audio } from '@/services/audioService'
import { analytics } from '@/services/analyticsService'

interface FloatingARMenuProps {
  onSelect: (section: Exclude<ExploreSection, null>) => void
  onOpenPresidents: () => void
}

export function FloatingARMenu({
  onSelect,
  onOpenPresidents,
}: FloatingARMenuProps) {
  const copy = t()
  const items: Array<
    | { id: Exclude<ExploreSection, null>; label: string }
    | { id: 'presidents'; label: string }
  > = [
    { id: 'presidents', label: copy.menuPresidents },
    { id: 'history', label: copy.menuHistory },
    { id: 'trophies', label: copy.menuTrophies },
    { id: 'legends', label: copy.menuLegends },
    { id: 'future', label: copy.menuFuture },
  ]

  return (
    <div className="absolute inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom)+4rem)] z-30 flex justify-center px-4">
      <div className="grid w-full max-w-sm grid-cols-2 gap-2.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              void audio.play('ui')
              if (item.id === 'presidents') {
                onOpenPresidents()
                return
              }
              analytics.sectionOpened(item.id)
              onSelect(item.id)
            }}
            className="rounded-2xl border border-white/15 bg-black/45 px-3 py-4 text-[11px] font-semibold tracking-[0.22em] text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition active:scale-[0.98]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
