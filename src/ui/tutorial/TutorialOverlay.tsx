import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { sim, useSim } from '../../state/store';
import { countOf, subscribeTelemetry } from '../../state/telemetry';
import { focusRoom } from '../../game/bridge';
import { tutorial } from './engine';
import { GuidePortrait } from './GuidePortrait';
import { TutorialCard } from './TutorialCard';

/**
 * Dimming veil built from four solid rectangles around the target.
 *
 * The previous implementation used `box-shadow: 0 0 0 9999px`, which the
 * Android WebView compositor rasterises into a gigantic layer: on phones that
 * produced white bands at the bottom of the screen and a blurry backdrop.
 * Four plain rects are cheap, exact and have no texture-size limits.
 */
function CoachVeil({ rect }: { rect: DOMRect }) {
  const pad = 5;
  const left = Math.max(0, rect.left - pad);
  const top = Math.max(0, rect.top - pad);
  const right = Math.min(window.innerWidth, rect.right + pad);
  const bottom = Math.min(window.innerHeight, rect.bottom + pad);
  const shade = 'rgba(1, 7, 11, 0.52)';

  return (
    <>
      <div className="coach-veil" style={{ left: 0, top: 0, width: '100%', height: top, background: shade }} aria-hidden="true" />
      <div
        className="coach-veil"
        style={{ left: 0, top: bottom, width: '100%', height: Math.max(0, window.innerHeight - bottom), background: shade }}
        aria-hidden="true"
      />
      <div
        className="coach-veil"
        style={{ left: 0, top, width: left, height: Math.max(0, bottom - top), background: shade }}
        aria-hidden="true"
      />
      <div
        className="coach-veil"
        style={{ left: right, top, width: Math.max(0, window.innerWidth - right), height: Math.max(0, bottom - top), background: shade }}
        aria-hidden="true"
      />
      <div className="coach-spot" style={{ left, top, width: right - left, height: bottom - top }} aria-hidden="true" />
    </>
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

  // the coach owns the screen while it is visible; narrating over it caused
  // two overlapping text panels on a phone
  useEffect(() => {
    document.body.dataset.coach = step ? 'on' : 'off';
    return () => {
      document.body.dataset.coach = 'off';
    };
  }, [step]);

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

  return createPortal(
    <>
      {target ? <CoachVeil rect={target} /> : null}
      <TutorialCard
        step={step}
        index={progress.index}
        total={tutorial.total}
        target={target}
        onAdvance={advance}
        onSkip={() => tutorial.skip()}
        onMinimize={() => tutorial.minimize()}
      />
    </>,
    document.body,
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
