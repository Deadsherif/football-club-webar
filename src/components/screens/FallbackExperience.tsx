import { t } from '@/i18n'

interface FallbackExperienceProps {
  onExplore: (section: 'history' | 'trophies' | 'legends' | 'future') => void
  onOpenPresidents: () => void
  onBack: () => void
}

export function FallbackExperience({
  onExplore,
  onOpenPresidents,
  onBack,
}: FallbackExperienceProps) {
  const copy = t()
  const items = [
    { id: 'presidents' as const, label: copy.menuPresidents },
    { id: 'history' as const, label: copy.menuHistory },
    { id: 'trophies' as const, label: copy.menuTrophies },
    { id: 'legends' as const, label: copy.menuLegends },
    { id: 'future' as const, label: copy.menuFuture },
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
                if (item.id === 'presidents') {
                  onOpenPresidents()
                  return
                }
                onExplore(item.id)
              }}
              className="rounded-2xl border border-white/12 bg-white/5 px-4 py-6 text-xs font-semibold tracking-[0.18em] text-white backdrop-blur-md transition active:scale-[0.98]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
