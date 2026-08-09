import { useState } from 'react'
import { createPortal } from 'react-dom'
import { t } from '@/i18n'
import { tacticEras, type TacticPlayer } from '@/data/tactics'
import { audio } from '@/services/audioService'

/** FUT-style tapered card silhouette. */
const CARD_CLIP = 'polygon(0 0, 100% 0, 100% 84%, 50% 100%, 0 84%)'

const lineAccent: Record<TacticPlayer['line'], string> = {
  GK: '#7ad3a0',
  DF: '#7fa8ff',
  MF: '#f4dd8a',
  FW: '#ff6b6b',
}

interface TacticsBoardProps {
  onClose: () => void
}

export function TacticsBoard({ onClose }: TacticsBoardProps) {
  const copy = t()
  const [eraId, setEraId] = useState(tacticEras[0].id)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const era = tacticEras.find((e) => e.id === eraId) ?? tacticEras[0]
  const selected = era.players.find((p) => p.id === selectedId) ?? null

  // Portal to <body>: the Explore panel's backdrop-filter ancestors would
  // otherwise become the containing block and trap this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-pitch-ink">
      <header className="flex items-start justify-between border-b border-white/10 px-5 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))]">
        <div>
          <h2 className="font-title text-sm tracking-[0.22em] text-white">
            {copy.tacticsTitle}
          </h2>
          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/35">
            {era.years}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void audio.play('ui')
            onClose()
          }}
          className="pt-1 text-[11px] tracking-[0.16em] text-white/50"
        >
          {copy.close}
        </button>
      </header>

      <div className="flex gap-2 px-5 pt-3">
        {tacticEras.map((option) => {
          const active = option.id === era.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                void audio.play('ui')
                setEraId(option.id)
                setSelectedId(null)
              }}
              className={`flex-1 rounded-xl border px-2 py-2 font-title text-xs tracking-[0.18em] transition ${
                active
                  ? 'border-pitch-gold/60 bg-pitch-gold/15 text-pitch-gold'
                  : 'border-white/10 bg-white/5 text-white/45'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-end justify-between px-5 pb-2 pt-3">
        <p className="font-title text-3xl leading-none tracking-[0.14em] text-pitch-gold">
          {era.formation}
        </p>
        <div className="text-end">
          <p className="text-[11px] font-semibold text-white">{era.trophy}</p>
          <p className="mt-0.5 text-[10px] text-white/45">{era.result}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-1">
        <div
          className="relative w-full max-w-[26rem] overflow-hidden rounded-2xl border border-white/10"
          style={{
            aspectRatio: '3 / 4',
            maxHeight: '100%',
            containerType: 'size',
            background:
              'linear-gradient(178deg, rgba(227,6,19,0.18) 0%, rgba(10,5,5,0.96) 42%, rgba(5,2,2,1) 100%)',
          }}
        >
          <PitchMarkings />

          {era.players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => {
                void audio.play('ui')
                setSelectedId(player.id)
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition active:scale-95"
              style={{ left: `${player.x}%`, top: `${player.y}%` }}
            >
              <MiniCard player={player} />
            </button>
          ))}
        </div>
      </div>

      <p className="px-5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 text-center text-[8px] uppercase leading-relaxed tracking-[0.14em] text-white/25">
        {copy.tacticsNote}
      </p>

      {selected && (
        <PlayerCardOverlay
          player={selected}
          era={era.label}
          trophy={era.trophy}
          onDismiss={() => {
            void audio.play('ui')
            setSelectedId(null)
          }}
        />
      )}
    </div>,
    document.body,
  )
}

/**
 * Card size tracks the pitch itself (container query units) so eleven cards
 * still fit without colliding on short viewports.
 */
function MiniCard({ player }: { player: TacticPlayer }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{
        height: 'min(11cqh, 19cqw)',
        aspectRatio: '49 / 66',
        fontSize: 'calc(min(11cqh, 19cqw) * 0.142)',
        padding: '0.22em 0.3em 0 0.3em',
        clipPath: CARD_CLIP,
        background:
          'linear-gradient(158deg, #f6e39b 0%, #d4af37 46%, #a8801f 78%, #6f5312 100%)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.55)',
      }}
    >
      <div className="flex w-full items-start justify-between leading-none">
        <div>
          <p
            className="font-title font-bold text-pitch-ink"
            style={{ fontSize: '1.65em' }}
          >
            {player.number}
          </p>
          <p
            className="font-bold tracking-[0.06em] text-pitch-ink/75"
            style={{ fontSize: '0.78em', marginTop: '0.15em' }}
          >
            {player.pos}
          </p>
        </div>
        <img
          src="/assets/crest.png"
          alt=""
          className="object-contain"
          style={{ height: '1.5em', width: '1.5em', marginTop: '0.1em' }}
        />
      </div>

      <div className="mt-auto w-full" style={{ paddingBottom: '2.1em' }}>
        <div
          className="mx-auto"
          style={{ height: '1px', width: '2.6em', marginBottom: '0.35em', background: 'rgba(10,5,5,0.35)' }}
        />
        <p
          className="truncate text-center font-bold uppercase leading-tight text-pitch-ink"
          style={{ fontSize: '0.82em' }}
        >
          {surname(player.name)}
        </p>
      </div>
    </div>
  )
}

function PlayerCardOverlay({
  player,
  era,
  trophy,
  onDismiss,
}: {
  player: TacticPlayer
  era: string
  trophy: string
  onDismiss: () => void
}) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-black/80 px-6 backdrop-blur-sm"
    >
      <div
        className="flex h-[19rem] w-[13.5rem] flex-col items-center px-4 pt-5"
        style={{
          clipPath: CARD_CLIP,
          background:
            'linear-gradient(158deg, #f9ecb8 0%, #d4af37 44%, #a8801f 76%, #6f5312 100%)',
          boxShadow: `0 18px 60px rgba(0,0,0,0.7), 0 0 40px ${lineAccent[player.line]}33`,
        }}
      >
        <div className="flex w-full items-start justify-between leading-none">
          <div>
            <p className="font-title text-[2.6rem] font-bold leading-none text-pitch-ink">
              {player.number}
            </p>
            <p className="mt-1 text-[11px] font-bold tracking-[0.12em] text-pitch-ink/75">
              {player.pos}
            </p>
          </div>
          <img src="/assets/crest.png" alt="" className="h-11 w-11 object-contain" />
        </div>

        <img
          src="/assets/crest.png"
          alt=""
          className="mt-1 h-24 w-24 object-contain opacity-25"
        />

        <div className="mt-auto w-full pb-9">
          <div className="mx-auto mb-2 h-px w-24" style={{ background: 'rgba(10,5,5,0.35)' }} />
          <p className="text-center font-title text-base font-bold uppercase tracking-[0.08em] text-pitch-ink">
            {surname(player.name)}
          </p>
          <p className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.1em] text-pitch-ink/65">
            {player.role}
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">{player.name}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
          {era} · {trophy}
        </p>
      </div>
    </button>
  )
}

function surname(name: string) {
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  const prev = parts[parts.length - 2]
  // Keep Arabic name particles attached: "Essam El Hadary" → "El Hadary".
  return /^(el|abou|abu|abd|abdel|bin|ben)$/i.test(prev) ? `${prev} ${last}` : last
}

function PitchMarkings() {
  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      fill="none"
      stroke="rgba(255,255,255,0.11)"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="10" y="10" width="280" height="380" rx="4" />
      <line x1="10" y1="200" x2="290" y2="200" />
      <circle cx="150" cy="200" r="42" />
      <rect x="75" y="10" width="150" height="52" />
      <rect x="112" y="10" width="76" height="22" />
      <rect x="75" y="338" width="150" height="52" />
      <rect x="112" y="368" width="76" height="22" />
    </svg>
  )
}
