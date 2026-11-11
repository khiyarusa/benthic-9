import { loadProgress, saveProgress, type TutorialProgress, TUTORIAL_STEPS } from './steps';

type Listener = () => void;

/**
 * Small tutorial state machine. Deliberately independent of React and of the
 * simulation so a step can be resumed after a reload, skipped, or replayed.
 */
class TutorialEngine {
  private progress: TutorialProgress = loadProgress();
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): TutorialProgress => this.progress;

  get step() {
    if (this.progress.done || this.progress.paused) return null;
    return TUTORIAL_STEPS[this.progress.index] ?? null;
  }

  get index(): number {
    return this.progress.index;
  }

  get total(): number {
    return TUTORIAL_STEPS.length;
  }

  private commit(next: TutorialProgress): void {
    this.progress = next;
    saveProgress(next);
    for (const listener of this.listeners) listener();
  }

  advance(): void {
    const nextIndex = Math.min(this.progress.index + 1, TUTORIAL_STEPS.length);
    this.commit({
      index: nextIndex,
      done: nextIndex >= TUTORIAL_STEPS.length,
      paused: false,
      minimized: this.progress.minimized,
    });
  }

  restart(): void {
    this.commit({ index: 0, done: false, paused: false, minimized: false });
  }

  resume(): void {
    if (this.progress.done) {
      this.restart();
      return;
    }
    this.commit({ ...this.progress, paused: false, minimized: false });
  }

  pause(): void {
    this.commit({ ...this.progress, paused: true });
  }

  skip(): void {
    this.commit({ index: TUTORIAL_STEPS.length, done: true, paused: false, minimized: false });
  }

  minimize(): void {
    this.commit({ ...this.progress, minimized: true });
  }

  expand(): void {
    this.commit({ ...this.progress, minimized: false });
  }

  /** Reload from storage (another tab, or a reset from the handbook). */
  refresh(): void {
    this.progress = loadProgress();
    for (const listener of this.listeners) listener();
  }
}

export const tutorial = new TutorialEngine();
