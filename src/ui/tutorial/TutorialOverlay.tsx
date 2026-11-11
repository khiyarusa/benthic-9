import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { sim, useSim } from '../../state/store';
import { countOf, subscribeTelemetry } from '../../state/telemetry';
import { focusRoom } from '../../game/bridge';
import { tutorial } from './engine';
import { GuidePortrait } from './GuidePortrait';
import { TutorialCard } from './TutorialCard';

/** Spotlight that dims the surroundings without blocking the target. */
function Spotlight({ rect }: { rect: DOMRect }) {
  return (
    <div
      className="coach-spot"
      style={{
        left: Math.max(0, rect.left - 5),
        top: Math.max(0, rect.top - 5),
        width: rect.width + 10,
        height: rect.height + 10,
      }}
      aria-hidden="true"
    />
  );
}

export function TutorialOverlay() {
  useSim();
  const progress = useSyncExternalStore(tutorial.subscribe, tutorial.getSnapshot);
  const [target, setTarget] = useState<DOMRect | null>(null);
  const [tick, setTick] = useState(0);
  const step = progress.done || progress.paused ? null : tutorial.step;

  useEffect(() => subscribeTelemetry(() => setTick((value) => value + 1)), []);
  useEffect(() => {
    const refresh = () => tutorial.refresh();
    window.addEventListener('benthic:tutorial-restart', refresh);
    return () => window.removeEventListener('benthic:tutorial-restart', refresh);
  }, []);

  // track the highlighted element
  useEffect(() => {
    if (!step?.target) {
      setTarget(null);
      return;
    }
    const measure = () => {
      const element = document.querySelector(step.target ?? '');
      if (!element) {
        setTarget(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        setTarget(null);
        return;
      }
      setTarget(rect);
    };
    measure();
    const timer = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', measure);
    };
  }, [step, tick]);

  // camera guidance
  useEffect(() => {
    if (step) focusRoom(step.room);
  }, [step]);

  const advance = useCallback(() => tutorial.advance(), []);

  // completion detection: real telemetry event or real simulation state
  useEffect(() => {
    if (!step || step.completion.manual) return;
    const state = sim.state;
    const byEvent = step.completion.event ? countOf(step.completion.event) > 0 : false;
    const byState = step.completion.state ? step.completion.state(state) : false;
    if (!byEvent && !byState) return;
    const timer = window.setTimeout(() => advance(), 450);
    return () => window.clearTimeout(timer);
  }, [step, tick, advance]);

  if (!step) return null;

  if (progress.minimized) {
    return (
      <button
        type="button"
        className="coach-pill"
        onClick={() => tutorial.expand()}
        aria-label="باز کردن راهنمای فرمانده"
      >
        <GuidePortrait size={22} />
        <span>راهنما</span>
      </button>
    );
  }

  return (
    <>
      {target ? <Spotlight rect={target} /> : null}
      <TutorialCard
        step={step}
        index={progress.index}
        total={tutorial.total}
        target={target}
        onAdvance={advance}
        onSkip={() => tutorial.skip()}
        onMinimize={() => tutorial.minimize()}
      />
    </>
  );
}

export function restartTutorial(): void {
  tutorial.restart();
  window.dispatchEvent(new CustomEvent('benthic:tutorial-restart'));
}

export function resumeTutorial(): void {
  tutorial.resume();
  window.dispatchEvent(new CustomEvent('benthic:tutorial-restart'));
}
