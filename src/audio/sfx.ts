const AUDIO_KEY = 'benthic9.audio';

let context: AudioContext | null = null;
let enabled = readSetting();

function readSetting(): boolean {
  try {
    return localStorage.getItem(AUDIO_KEY) !== 'off';
  } catch {
    return true;
  }
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function isAudioEnabled(): boolean {
  return enabled;
}

export function setAudioEnabled(next: boolean): void {
  enabled = next;
  try {
    localStorage.setItem(AUDIO_KEY, next ? 'on' : 'off');
  } catch {
    /* storage may be unavailable */
  }
  if (next) startAmbient();
  else stopAmbient();
}

function tone(frequency: number, duration: number, type: OscillatorType, gainValue: number, slideTo?: number): void {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
}

export function playClick(): void {
  tone(760, 0.055, 'square', 0.035, 520);
}

export function playConfirm(): void {
  tone(440, 0.09, 'triangle', 0.05, 660);
  window.setTimeout(() => tone(880, 0.08, 'triangle', 0.04), 70);
}

export function playAlarm(): void {
  tone(320, 0.22, 'sawtooth', 0.05, 220);
  window.setTimeout(() => tone(320, 0.22, 'sawtooth', 0.05, 220), 260);
}

interface AmbientRig {
  master: GainNode;
  filter: BiquadFilterNode;
  oscillators: OscillatorNode[];
}

let ambient: AmbientRig | null = null;

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

/** Deep-sea room tone: two detuned low oscillators plus filtered water noise. */
export function startAmbient(): void {
  if (!enabled || ambient) return;
  const ctx = ensureContext();
  if (!ctx) return;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 240;
  filter.Q.value = 0.6;
  filter.connect(master);

  const oscA = ctx.createOscillator();
  oscA.type = 'sine';
  oscA.frequency.value = 46;
  const oscB = ctx.createOscillator();
  oscB.type = 'sine';
  oscB.frequency.value = 55.4;
  const oscGainA = ctx.createGain();
  oscGainA.gain.value = 0.5;
  const oscGainB = ctx.createGain();
  oscGainB.gain.value = 0.32;
  oscA.connect(oscGainA).connect(filter);
  oscB.connect(oscGainB).connect(filter);

  const noise = ctx.createBufferSource();
  noise.buffer = makeNoiseBuffer(ctx);
  noise.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.35;
  noise.connect(noiseGain).connect(filter);

  oscA.start();
  oscB.start();
  noise.start();
  master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4);

  ambient = { master, filter, oscillators: [oscA, oscB] };
  void noise;
}

export function setAmbientIntensity(level: number): void {
  if (!ambient || !context) return;
  const clamped = Math.max(0, Math.min(1, level));
  ambient.filter.frequency.setTargetAtTime(220 + clamped * 520, context.currentTime, 0.8);
  ambient.master.gain.setTargetAtTime(0.045 + clamped * 0.03, context.currentTime, 1.2);
}

export function stopAmbient(): void {
  if (!ambient || !context) return;
  const rig = ambient;
  ambient = null;
  rig.master.gain.setTargetAtTime(0.0001, context.currentTime, 0.4);
  window.setTimeout(() => {
    for (const osc of rig.oscillators) {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    }
    rig.master.disconnect();
  }, 1200);
}
