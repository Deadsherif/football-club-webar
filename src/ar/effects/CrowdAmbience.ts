/**
 * Procedural stadium crowd ambience via Web Audio — no large audio assets.
 * Soft roar + intermittent swell, faded with the cinematic.
 */
export class CrowdAmbience {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sources: AudioBufferSourceNode[] = []
  private filters: BiquadFilterNode[] = []
  private started = false
  private targetGain = 0
  private currentGain = 0
  private raf = 0

  async unlock(): Promise<void> {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
  }

  async start(): Promise<void> {
    await this.unlock()
    if (!this.ctx || this.started) return

    this.master = this.ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(this.ctx.destination)

    // Layered filtered noise = distant crowd.
    for (let i = 0; i < 3; i++) {
      const buffer = this.makeNoiseBuffer(2.5 + i * 0.4)
      const src = this.ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true

      const filter = this.ctx.createBiquadFilter()
      filter.type = i === 0 ? 'bandpass' : i === 1 ? 'lowpass' : 'bandpass'
      filter.frequency.value = i === 0 ? 480 : i === 1 ? 900 : 1600
      filter.Q.value = i === 0 ? 0.7 : 0.5

      const layerGain = this.ctx.createGain()
      layerGain.gain.value = i === 1 ? 0.22 : 0.12

      src.connect(filter)
      filter.connect(layerGain)
      layerGain.connect(this.master)

      src.start()
      this.sources.push(src)
      this.filters.push(filter)
    }

    this.started = true
    this.tick()
  }

  setLevel(level: number): void {
    this.targetGain = Math.min(1, Math.max(0, level)) * 0.28
  }

  stop(): void {
    this.targetGain = 0
    this.currentGain = 0
    cancelAnimationFrame(this.raf)
    for (const src of this.sources) {
      try {
        src.stop()
      } catch {
        // already stopped
      }
    }
    this.sources = []
    this.filters = []
    void this.ctx?.close()
    this.ctx = null
    this.master = null
    this.started = false
  }

  private tick = (): void => {
    this.raf = requestAnimationFrame(this.tick)
    if (!this.master || !this.ctx) return

    this.currentGain += (this.targetGain - this.currentGain) * 0.04
    this.master.gain.value = this.currentGain

    // Occasional roar swell
    const t = this.ctx.currentTime
    const swell = 1 + Math.sin(t * 0.7) * 0.08 + Math.sin(t * 1.9) * 0.05
    this.master.gain.value = this.currentGain * swell
  }

  private makeNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!
    const rate = ctx.sampleRate
    const length = Math.floor(rate * seconds)
    const buffer = ctx.createBuffer(1, length, rate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i++) {
      // Brown-ish noise — softer than white for crowd body.
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    return buffer
  }
}
