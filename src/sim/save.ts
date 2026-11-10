import { GAME_VERSION, SAVE_KEY } from './content';
import type { GameState } from './types';

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__benthic_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== GAME_VERSION) return null;
    if (!parsed.rooms || !parsed.equipment || !Array.isArray(parsed.crew)) return null;
    if (typeof parsed.minute !== 'number' || typeof parsed.depthM !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(SAVE_KEY, serialize(state));
    store.setItem(`${SAVE_KEY}.savedAt`, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): GameState | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(SAVE_KEY);
  if (!raw) return null;
  return deserialize(raw);
}

export function hasSave(): boolean {
  const store = storage();
  if (!store) return false;
  return store.getItem(SAVE_KEY) !== null;
}

export function savedAt(): number | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(`${SAVE_KEY}.savedAt`);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function deleteSave(): void {
  const store = storage();
  if (!store) return;
  store.removeItem(SAVE_KEY);
  store.removeItem(`${SAVE_KEY}.savedAt`);
}
