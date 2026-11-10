import { useSyncExternalStore } from 'react';
import { BenthicSimulationCore } from '../sim/engine';
import { createInitialState } from '../sim/state';
import { loadGame, saveGame } from '../sim/save';
import type { GameMode } from '../sim/types';

const restored = loadGame();

export const sim = new BenthicSimulationCore(restored ?? createInitialState('campaign'));
export const hadSaveAtBoot = restored !== null;

let version = 0;
const listeners = new Set<() => void>();

sim.subscribe(() => {
  version += 1;
  for (const listener of listeners) listener();
});

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Re-renders the React tree whenever the simulation emits. */
export function useSim(): number {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
}

export function startNewGame(mode: GameMode): void {
  sim.replaceState(createInitialState(mode));
  sim.start();
}

export function continueGame(): boolean {
  const loaded = loadGame();
  if (!loaded) return false;
  sim.replaceState(loaded);
  sim.start();
  return true;
}

export function persist(): boolean {
  return saveGame(sim.state);
}

export function togglePause(): void {
  sim.togglePause();
}
