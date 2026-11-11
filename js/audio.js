// Efeitos sonoros sintetizados com Web Audio API (nenhum arquivo de áudio é necessário).

export class SFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  // O navegador só libera áudio depois de um clique do usuário.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  get ready() {
    return this.enabled && this.ctx;
  }

  noiseBuffer(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Rajada de ruído filtrado com envelope de volume.
  noise({ duration = 0.1, freq = 2000, type = 'bandpass', q = 1, gain = 0.5, when = 0 } = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer(duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + duration);
  }

  tone({ freq = 440, duration = 0.2, type = 'sine', gain = 0.3, when = 0, slideTo = null } = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + duration);
  }

  card() {
    this.noise({ duration: 0.08, freq: 3500, q: 0.7, gain: 0.25 });
  }

  chip() {
    this.tone({ freq: 2400, duration: 0.05, type: 'triangle', gain: 0.12 });
    this.tone({ freq: 3100, duration: 0.05, type: 'triangle', gain: 0.1, when: 0.04 });
  }

  tick(gain = 0.35) {
    this.noise({ duration: 0.03, freq: 4200, q: 4, gain });
    this.tone({ freq: 1800, duration: 0.025, type: 'square', gain: gain * 0.15 });
  }

  cock() {
    this.tick(0.5);
    setTimeout(() => this.tick(0.6), 120);
  }

  dryClick() {
    this.noise({ duration: 0.06, freq: 2600, q: 6, gain: 0.9 });
    this.tone({ freq: 900, duration: 0.05, type: 'square', gain: 0.08 });
  }

  bang() {
    if (!this.ready) return;
    this.noise({ duration: 1.2, freq: 900, type: 'lowpass', q: 0.5, gain: 1.4 });
    this.noise({ duration: 0.25, freq: 5000, type: 'highpass', q: 0.5, gain: 0.8 });
    this.tone({ freq: 120, duration: 0.6, type: 'sine', gain: 0.9, slideTo: 35 });
  }

  heartbeat(times = 3, interval = 0.7) {
    for (let i = 0; i < times; i++) {
      const w = i * interval;
      this.tone({ freq: 60, duration: 0.18, gain: 0.8, when: w, slideTo: 40 });
      this.tone({ freq: 55, duration: 0.15, gain: 0.6, when: w + 0.22, slideTo: 38 });
    }
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone({ freq: f, duration: 0.25, type: 'triangle', gain: 0.2, when: i * 0.12 }));
  }

  lose() {
    [392, 330, 262].forEach((f, i) => this.tone({ freq: f, duration: 0.35, type: 'sawtooth', gain: 0.08, when: i * 0.18 }));
  }
}
