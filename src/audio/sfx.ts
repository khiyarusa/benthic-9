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
