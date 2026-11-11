/**
 * Audio mixer for real, bundled recordings.
 *
 * Layers: music (adaptive), ambience (station machinery / vent), sfx one-shots,
 * and Persian narrator voice. Every file is local; nothing is streamed.
 * If a buffer cannot be decoded the caller keeps the procedural fallback.
 */

export type MusicScene = 'menu' | 'calm' | 'tension' | 'emergency' | 'signal' | 'dive';

export interface AudioVolumes {
  master: number;
  music: number;
  ambience: number;
  sfx: number;
  voice: number;
}

const STORAGE_KEY = 'benthic9.audio.mix.v1';

const DEFAULTS: AudioVolumes = { master: 0.85, music: 0.5, ambience: 0.55, sfx: 0.8, voice: 0.95 };

function readVolumes(): AudioVolumes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AudioVolumes>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let volumes = readVolumes();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let buses: Record<keyof Omit<AudioVolumes, 'master'>, GainNode> | null = null;
const buffers = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<AudioBuffer | null>>();
let enabled = true;
interface Bed {
  id: string;
  node: AudioBufferSourceNode | null;
  gain: GainNode | null;
}

let musicBed: Bed | null = null;
let ambBed: Bed | null = null;
let currentScene: MusicScene | null = null;
let duckUntil = 0;

export const MUSIC_BY_SCENE: Record<MusicScene, string | null> = {
  menu: 'music-menu',
  calm: 'music-calm',
  tension: 'music-tension',
  emergency: 'music-tension',
  signal: 'music-signal',
  dive: 'music-signal',
};

export const AMBIENCE_BY_SCENE: Partial<Record<MusicScene, string>> = {
  menu: 'amb-engine',
  calm: 'amb-engine',
  tension: 'amb-engine',
  emergency: 'amb-engine',
  signal: 'amb-engine',
  dive: 'amb-vent',
};

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? volumes.master : 0;
    master.connect(ctx.destination);
    const make = (value: number) => {
      const g = ctx!.createGain();
      g.gain.value = value;
      g.connect(master!);
      return g;
    };
    buses = {
      music: make(volumes.music),
      ambience: make(volumes.ambience),
      sfx: make(volumes.sfx),
      voice: make(volumes.voice),
    };
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio(): void {
  ensureContext();
}

async function load(id: string): Promise<AudioBuffer | null> {
  if (buffers.has(id)) return buffers.get(id)!;
  if (pending.has(id)) return pending.get(id)!;
  const context = ensureContext();
  if (!context) return null;
  const task = (async () => {
    try {
      const res = await fetch(`audio/${id}.ogg`);
      if (!res.ok) throw new Error(`missing audio/${id}.ogg (${res.status})`);
      const array = await res.arrayBuffer();
      const buffer = await context.decodeAudioData(array);
      buffers.set(id, buffer);
      return buffer;
    } catch (error) {
      if (false) console.warn('[audio]', id, error);
      return null;
    } finally {
      pending.delete(id);
    }
  })();
  pending.set(id, task);
  return task;
}

function startLoop(id: string, bus: GainNode, level: number): Bed {
  const context = ensureContext();
  const buffer = buffers.get(id);
  if (!context || !buffer) return { id, node: null, gain: null };
  const node = context.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  const gain = context.createGain();
  gain.gain.value = 0.0001;
  node.connect(gain).connect(bus);
  node.start();
  gain.gain.linearRampToValueAtTime(level, context.currentTime + 2.5);
  return { id, node, gain };
}

function stopLoop(rig: Bed | null, fade = 2): void {
  const context = ctx;
  if (!rig || !context || !rig.node || !rig.gain) return;
  const { node, gain } = rig;
  gain.gain.cancelScheduledValues(context.currentTime);
  gain.gain.setTargetAtTime(0.0001, context.currentTime, fade / 3);
  window.setTimeout(() => {
    try {
      node.stop();
      node.disconnect();
      gain.disconnect();
    } catch {
      /* already stopped */
    }
  }, fade * 1000 + 200);
}

/** Crossfades the bed for a scene; safe to call every frame. */
export async function setScene(scene: MusicScene): Promise<void> {
  if (scene === currentScene) return;
  currentScene = scene;
  const context = ensureContext();
  if (!context || !buses || !enabled) return;

  const musicId = MUSIC_BY_SCENE[scene];
  if (musicId) await load(musicId);
  const ambId = AMBIENCE_BY_SCENE[scene] ?? 'amb-engine';
  await load(ambId);

  if (musicId && musicBed?.id !== musicId) {
    stopLoop(musicBed, 2.5);
    musicBed = startLoop(musicId, buses.music, scene === 'emergency' ? 0.42 : 0.28);
  }
  if (ambBed?.id !== ambId) {
    stopLoop(ambBed, 2.5);
    ambBed = startLoop(ambId, buses.ambience, scene === 'dive' ? 0.5 : 0.34);
  }
}

export async function playEffect(id: string, gain = 1): Promise<void> {
  const context = ensureContext();
  if (!context || !buses || !enabled) return;
  const buffer = await load(id);
  if (!buffer) return;
  const node = context.createBufferSource();
  node.buffer = buffer;
  const g = context.createGain();
  g.gain.value = gain;
  node.connect(g).connect(buses.sfx);
  node.start();
}

/** Persian narrator line. Returns the duration so subtitles can follow it. */
export async function speak(id: string): Promise<number> {
  const context = ensureContext();
  if (!context || !buses || !enabled) return 0;
  const buffer = await load(`voice/${id}`);
  if (!buffer) return 0;
  const node = context.createBufferSource();
  node.buffer = buffer;
  const g = context.createGain();
  g.gain.value = 1;
  node.connect(g).connect(buses.voice);
  const now = context.currentTime;
  const end = now + buffer.duration;
  duckUntil = end + 0.4;
  if (musicBed?.gain) {
    const bed = musicBed.gain.gain;
    bed.cancelScheduledValues(now);
    bed.setTargetAtTime(0.09, now, 0.25);
    bed.setTargetAtTime(0.28, end + 0.2, 0.6);
  }
  node.start();
  return buffer.duration;
}

export function isDucking(): boolean {
  return ctx ? ctx.currentTime < duckUntil : false;
}

export function getVolumes(): AudioVolumes {
  return { ...volumes };
}

export function setVolumes(next: Partial<AudioVolumes>): AudioVolumes {
  volumes = { ...volumes, ...next };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes));
  } catch {
    /* storage may be unavailable */
  }
  if (master && ctx) master.gain.setTargetAtTime(enabled ? volumes.master : 0, ctx.currentTime, 0.08);
  if (buses && ctx) {
    buses.music.gain.setTargetAtTime(volumes.music, ctx.currentTime, 0.08);
    buses.ambience.gain.setTargetAtTime(volumes.ambience, ctx.currentTime, 0.08);
    buses.sfx.gain.setTargetAtTime(volumes.sfx, ctx.currentTime, 0.08);
    buses.voice.gain.setTargetAtTime(volumes.voice, ctx.currentTime, 0.08);
  }
  return { ...volumes };
}

export function setMixEnabled(next: boolean): void {
  enabled = next;
  if (master && ctx) master.gain.setTargetAtTime(enabled ? volumes.master : 0, ctx.currentTime, 0.1);
  if (!enabled) {
    stopLoop(musicBed, 1);
    stopLoop(ambBed, 1);
    musicBed = null;
    ambBed = null;
    currentScene = null;
  }
}

export function isMixEnabled(): boolean {
  return enabled;
}

/** Preloads the beds a session will most likely need, without blocking play. */
export function preload(ids: string[]): void {
  for (const id of ids) void load(id);
}
