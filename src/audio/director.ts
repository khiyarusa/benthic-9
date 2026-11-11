import { playAlarm, playClick, playConfirm } from './sfx';
import { playEffect, setScene, speak, unlockAudio, type MusicScene } from './mixer';
import type { GameState } from '../sim/types';

/** Translates live simulation state into the audio bed, effects and narration. */

let lastScene: MusicScene | null = null;
let lastAlarmAt = 0;
let lastVoiceAt = 0;
const spoken = new Set<string>();

function lowestO2(state: GameState): number {
  return Math.min(...Object.values(state.rooms).map((room) => room.o2));
}

function highestCO2(state: GameState): number {
  return Math.max(...Object.values(state.rooms).map((room) => room.co2));
}

function criticalCount(state: GameState): number {
  let n = 0;
  if (lowestO2(state) < 16) n += 1;
  if (highestCO2(state) > 4.2) n += 1;
  if (state.power.brownout) n += 1;
  if (state.hullIntegrity < 42) n += 1;
  return n;
}

export function sceneForState(state: GameState, mode: 'menu' | 'dive' = 'menu'): MusicScene {
  if (mode === 'dive') return 'dive';
  if (criticalCount(state) > 0) return 'emergency';
  if (state.rov.deployed) return 'tension';
  if (state.power.brownout || lowestO2(state) < 20) return 'tension';
  return 'calm';
}

export function applyScene(scene: MusicScene): void {
  if (scene === lastScene) return;
  lastScene = scene;
  void setScene(scene);
}

export function tickAudio(state: GameState, mode: 'menu' | 'dive' = 'menu'): void {
  unlockAudio();
  applyScene(sceneForState(state, mode));

  const now = Date.now();
  if (criticalCount(state) > 0 && now - lastAlarmAt > 9000) {
    lastAlarmAt = now;
    void playEffect('sfx-klaxon', 0.5);
    playAlarm();
  }
}

/** Speaks a narrator line once per session unless `repeat` is set. */
export async function narrate(id: string, options: { repeat?: boolean; onEnd?: () => void } = {}): Promise<void> {
  unlockAudio();
  if (!options.repeat && spoken.has(id)) return;
  if (Date.now() - lastVoiceAt < 1200) return;
  spoken.add(id);
  lastVoiceAt = Date.now();
  window.dispatchEvent(new CustomEvent('voice:line', { detail: { id } }));
  const duration = await speak(id);
  if (options.onEnd) window.setTimeout(options.onEnd, Math.max(400, duration * 1000));
}

export function eventDoor(): void {
  void playEffect('sfx-door', 0.7);
}

export function eventCreak(): void {
  void playEffect('sfx-hull-creak', 0.6);
}

export function eventSonar(): void {
  void playEffect('sfx-sonar', 0.55);
}

export function eventWater(): void {
  void playEffect('sfx-water', 0.5);
}

export function eventStatic(): void {
  void playEffect('sfx-static', 0.4);
}

export function uiClick(): void {
  playClick();
}

export function uiConfirm(): void {
  playConfirm();
}

export function resetNarration(): void {
  spoken.clear();
  lastScene = null;
}
