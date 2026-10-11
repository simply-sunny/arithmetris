class SoundEngine {
  private ctx: AudioContext | null = null
  private muted: boolean = false
  private buffers = new Map<string, AudioBuffer>()
  private loading = false

  private loadSamples() {
    if (this.loading || !this.ctx) return
    this.loading = true
    const files = { key: 'text-scroll.wav', menu: 'menu-select.wav', approval: 'approval.wav', processing: 'processing.mp3' }
    for (const [name, file] of Object.entries(files)) {
      fetch(`/audio/${file}`).then((response) => {
        if (!response.ok) throw new Error('Audio unavailable')
        return response.arrayBuffer()
      }).then((data) => this.ctx!.decodeAudioData(data)).then((buffer) => this.buffers.set(name, buffer)).catch(() => {})
    }
  }

  private sample(name: string, volume: number, offset = 0, duration?: number, rate = 1) {
    if (this.muted) return true
    this.init()
    const buffer = this.buffers.get(name)
    if (!buffer || !this.ctx) return false
    const source = this.ctx.createBufferSource()
    const gain = this.ctx.createGain()
    source.buffer = buffer
    source.playbackRate.value = rate
    const length = duration ?? buffer.duration - offset
    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + .005)
    gain.gain.setValueAtTime(volume, now + Math.max(.006, length / rate - .025))
    gain.gain.linearRampToValueAtTime(0, now + length / rate)
    source.connect(gain)
    gain.connect(this.ctx.destination)
    source.start(now, offset, length)
    source.onended = () => { source.disconnect(); gain.disconnect() }
    return true
  }

  public playMenu() {
    if (!this.sample('menu', .12, 0, .3)) this.playKey()
  }

  public playLand() {
    this.sample('key', .06, .3, .1, .8)
  }

  public playProcessing() {
    if (!this.sample('processing', .14, 0, 2.3)) this.playWaveAdvance()
  }

  public playAchievement() {
    if (!this.sample('approval', .22)) this.playWaveAdvance()
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    this.loadSamples()
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted
  }

  public isMuted(): boolean {
    return this.muted
  }

  public toggleMute(): boolean {
    this.muted = !this.muted
    return this.muted
  }

  // Key tap sound
  public playKey() {
    if (this.sample('key', .045, .15 + Math.random() * .8, .045)) return
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const now = this.ctx.currentTime

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04)

    gain.gain.setValueAtTime(0.05, now)
    gain.gain.linearRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  // Guess submission sound - frequency scales with proximity!
  public playResonance(proximity: number) {
    if (proximity >= 30 && this.sample(proximity >= 80 ? 'approval' : 'menu', proximity >= 80 ? .13 : .07, 0, proximity >= 80 ? undefined : .3)) return
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    if (proximity === 100) {
      // 100% PERFECT! Major triad chord arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        const noteTime = now + idx * 0.06

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, noteTime)

        gain.gain.setValueAtTime(0, noteTime)
        gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4)

        osc.connect(gain)
        gain.connect(this.ctx!.destination)

        osc.start(noteTime)
        osc.stop(noteTime + 0.45)
      })
    } else if (proximity >= 70) {
      // High proximity (close miss)
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      const baseFreq = 440 + (proximity - 70) * 12
      osc.type = 'sine'
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.15)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.26)
    } else if (proximity > 0) {
      // Low proximity blip
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      const baseFreq = 260 + proximity * 2
      osc.type = 'square'
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, now + 0.1)

      gain.gain.setValueAtTime(0.05, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.1)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.11)
    } else {
      // Complete miss (0%)
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.linearRampToValueAtTime(80, now + 0.18)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.2)
    }
  }

  // Shatter / destroy explosion
  public playShatter() {
    if (this.sample('menu', .09, 0, .25, .65)) return
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.22)
  }

  // Wave advance fanfare
  public playWaveAdvance() {
    if (this.sample('approval', .18)) return
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const freqs = [440, 554.37, 659.25, 880] // A major
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      const t = now + i * 0.08

      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, t)

      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(t)
      osc.stop(t + 0.35)
    })
  }

  // Game over sound
  public playGameOver() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [392, 349.23, 329.63, 261.63] // G4, F4, E4, C4
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      const t = now + i * 0.15

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f, t)
      osc.frequency.linearRampToValueAtTime(f * 0.9, t + 0.25)

      gain.gain.setValueAtTime(0.12, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(t)
      osc.stop(t + 0.35)
    })
  }
}

export const sounds = new SoundEngine()
