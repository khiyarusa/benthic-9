/**
 * Tiny telemetry bus used by the tutorial and by the commander's handbook.
 * It records *player intents* (opened a panel, selected a room) that cannot be
 * derived from the simulation state. Nothing leaves the device.
 */
type Listener = () => void;

const counters = new Map<string, number>();
const listeners = new Set<Listener>();

export function track(event: string): void {
  counters.set(event, (counters.get(event) ?? 0) + 1);
  for (const listener of listeners) listener();
}

export function countOf(event: string): number {
  return counters.get(event) ?? 0;
}

export function subscribeTelemetry(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetTelemetry(): void {
  counters.clear();
  for (const listener of listeners) listener();
}
