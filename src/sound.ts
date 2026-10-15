class SoundEngine {
  private ctx: AudioContext | null = null
  public enabled: boolean = false

  constructor() {
    try {
      this.enabled = window.localStorage.getItem('akif-sound') === '1'
    } catch {
      this.enabled = false
    }
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public toggle(): boolean {
    this.enabled = !this.enabled
    try {
      window.localStorage.setItem('akif-sound', this.enabled ? '1' : '0')
    } catch {
      // ignore storage errors
    }
    if (this.enabled) this.playClick(920)
    return this.enabled
  }

  public playClick(freq = 680, duration = 0.018) {
    const ctx = this.getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + duration)
    gain.gain.setValueAtTime(0.045, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  // Heavy sub-bass thud when TURN SYSTEM ON is clicked
  public playRelayImpact() {
    const ctx = this.getContext()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(130, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.22)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.24)
  }

  // Crystalline fracture burst when screen shatters at 100%
  public playShatter() {
    const ctx = this.getContext()
    if (!ctx) return
    const freqs = [1420, 2180, 3100, 4400, 190]
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = idx === 4 ? 'sawtooth' : 'triangle'
      osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.012)
      osc.frequency.exponentialRampToValueAtTime(f * 0.35, ctx.currentTime + 0.32)
      gain.gain.setValueAtTime(idx === 4 ? 0.12 : 0.04, ctx.currentTime + idx * 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + idx * 0.012)
      osc.stop(ctx.currentTime + 0.36)
    })
  }
}

export const sound = new SoundEngine()
