import { t } from '@/i18n'
import type { ExploreSection } from '@/types/ar'

interface FallbackExperienceProps {
  onOpenPresidents: () => void
  onOpenLegends: () => void
  onOpenTrophies: () => void
  onOpenBoard: () => void
  onOpenRedCastle: () => void
  onExplore: (section: Exclude<ExploreSection, null>) => void
  onBack: () => void
}

export function FallbackExperience({
  onOpenPresidents,
  onOpenLegends,
  onOpenTrophies,
  onOpenBoard,
  onOpenRedCastle,
  onExplore,
  onBack,
}: FallbackExperienceProps) {
  const copy = t()
  const items: Array<{
    id: 'presidents' | 'legends' | 'trophies' | 'board' | 'red-castle'
    label: string
  }> = [
    { id: 'presidents', label: copy.menuPresidents },
    { id: 'legends', label: copy.menuLegends },
    { id: 'trophies', label: copy.menuTrophies },
    { id: 'board', label: copy.menuBoard },
    { id: 'red-castle', label: copy.menuRedCastle },
  ]

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-10 pt-14">
      <div className="pointer-events-none absolute inset-0 bg-pitch" />
      <button
        type="button"
        onClick={onBack}
        className="relative z-10 self-start text-xs tracking-[0.2em] text-white/50"
      >
        ← {copy.back}
      </button>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-md text-center">
        <h1 className="font-title text-2xl tracking-[0.16em] text-white">
          {copy.fallbackTitle}
        </h1>
        <p className="mt-3 text-sm text-white/60">{copy.fallbackBody}</p>
        <p className="mt-2 text-xs text-white/35">{copy.unsupportedTitle}</p>

        <div className="mt-10 grid grid-cols-2 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'presidents') onOpenPresidents()
                else if (item.id === 'legends') onOpenLegends()
                else if (item.id === 'trophies') onOpenTrophies()
                else if (item.id === 'board') onOpenBoard()
                else if (item.id === 'red-castle') onOpenRedCastle()
                else onExplore(item.id)
              }}
              className="rounded-2xl border border-white/12 bg-white/5 px-4 py-6 text-xs font-semibold tracking-[0.12em] text-white backdrop-blur-md transition active:scale-[0.98]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
