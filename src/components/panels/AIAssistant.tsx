import { useState } from 'react'
import { t } from '@/i18n'
import { aiService, type AIMessage } from '@/services/aiService'
import { audio } from '@/services/audioService'

interface AIAssistantProps {
  open: boolean
  onClose: () => void
}

export function AIAssistant({ open, onClose }: AIAssistantProps) {
  const copy = t()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask me about Al Ahly history, trophies, legends, or the future of the club.',
    },
  ])

  if (!open) return null

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    void audio.play('ui')
    setInput('')
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setBusy(true)
    const reply = await aiService.ask(text, next)
    setMessages([...next, { role: 'assistant', content: reply }])
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-20">
      <div className="flex max-h-[70dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0c0708]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-title text-sm tracking-[0.2em] text-pitch-gold">
            {copy.askAlAhly}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] tracking-[0.16em] text-white/50"
          >
            {copy.close}
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'ms-auto bg-ahly-red/80 text-white'
                  : 'bg-white/8 text-white/80'
              }`}
            >
              {m.content}
            </div>
          ))}
          {busy && <p className="text-xs text-white/40">…</p>}
        </div>

        <form
          className="flex gap-2 border-t border-white/10 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={copy.aiPlaceholder}
            className="min-h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white outline-none placeholder:text-white/30"
          />
          <button
            type="submit"
            className="rounded-full bg-ahly-red px-4 text-[11px] font-semibold tracking-[0.14em] text-white"
          >
            {copy.aiSend}
          </button>
        </form>
      </div>
    </div>
  )
}
