import { t } from '@/i18n'

interface IntroScreenProps {
  crestSrc: string
  onOpenCamera: () => void
  onBack: () => void
}

export function IntroScreen({ crestSrc, onOpenCamera, onBack }: IntroScreenProps) {
  const copy = t()

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-pitch" />
      <div className="pointer-events-none absolute inset-0 bg-vignette" />

      <button
        type="button"
        onClick={onBack}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] z-20 text-xs tracking-[0.2em] text-white/55"
      >
        ← {copy.back}
      </button>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-title text-xl tracking-[0.28em] text-white sm:text-2xl">
          {copy.journeyTitle}
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
          {copy.journeyHint}
        </p>

        <div className="relative mt-12 flex h-56 w-56 items-center justify-center">
          <div className="scan-frame absolute inset-0 rounded-3xl border border-pitch-gold/50" />
          <div className="scan-line absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-ahly-red to-transparent" />
          <img
            src={crestSrc}
            alt=""
            className="h-20 w-20 object-contain opacity-90"
            draggable={false}
          />
        </div>

        <button
          type="button"
          onClick={onOpenCamera}
          className="mt-12 min-h-14 w-full max-w-xs rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold tracking-[0.22em] text-white backdrop-blur-md transition active:scale-[0.98]"
        >
          {copy.openCamera}
        </button>
      </main>
    </div>
  )
}
