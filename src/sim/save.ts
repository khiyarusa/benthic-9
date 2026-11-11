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
    const parsed = JSON.parse(raw) as GameState & { version?: number };
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.rooms || !parsed.equipment || !Array.isArray(parsed.crew)) return null;
    if (typeof parsed.minute !== 'number' || typeof parsed.depthM !== 'number') return null;

    // Player saves from the first release must keep working (directive rule 6).
    if (parsed.version === 1) {
      parsed.version = GAME_VERSION;
      if (typeof parsed.hullIntegrity !== 'number') {
        const rooms = Object.values(parsed.rooms);
        parsed.hullIntegrity = rooms.length
          ? rooms.reduce((sum, room) => sum + room.hull, 0) / rooms.length
          : 100;
      }
      for (const room of Object.values(parsed.rooms)) {
        if (!room.breachSize) room.breachSize = room.breached ? 0.5 : 0;
      }
    }

    if (parsed.version !== GAME_VERSION) return null;
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
