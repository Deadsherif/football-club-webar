export type SoundId =
  | 'intro'
  | 'scan'
  | 'detect'
  | 'portal'
  | 'stadium'
  | 'crowd'
  | 'ui'

/**
 * Click-only audio for MVP. Background / ambience beds are disabled.
 */
class AudioService {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private unlocked = false

  async unlock(): Promise<void> {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.55
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    this.unlocked = true
  }

  async play(id: SoundId): Promise<void> {
    if (id !== 'ui') return
    if (!this.unlocked) await this.unlock()
    if (!this.ctx || !this.master) return

    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + 0.08)
  }

  startLoop(_id: SoundId, _level = 0.2): void {
    // no-op — ambience disabled
  }

  setLoopLevel(_id: SoundId, _level: number): void {
    // no-op
  }

  stopLoop(_id: SoundId): void {
    // no-op
  }

  stopAll(): void {
    // no-op
  }

  dispose(): void {
    void this.ctx?.close()
    this.ctx = null
    this.master = null
    this.unlocked = false
  }
}

export const audio = new AudioService()
