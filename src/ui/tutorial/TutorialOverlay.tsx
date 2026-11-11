import { useCallback, useEffect, useRef, useState } from 'react';
import { sim, useSim } from '../../state/store';
import { countOf, subscribeTelemetry } from '../../state/telemetry';
import { focusRoom } from '../../game/bridge';
import { fa } from '../../sim/format';
import { GuidePortrait } from './GuidePortrait';
import {
  GUIDE,
  TUTORIAL_STEPS,
  TUTORIAL_TITLE,
  loadTutorialProgress,
  saveTutorialProgress,
  type TutorialProgress,
} from './steps';

export function TutorialOverlay() {
  useSim();
  const [progress, setProgress] = useState<TutorialProgress>(() => loadTutorialProgress());
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pulse, setPulse] = useState(0);
  const advanceTimer = useRef<number | null>(null);

  const step = progress.done || progress.paused ? null : TUTORIAL_STEPS[progress.index] ?? null;

  // re-render whenever a tracked intent happens
  useEffect(() => subscribeTelemetry(() => setPulse((value) => value + 1)), []);

  useEffect(() => {
    const reload = () => setProgress(loadTutorialProgress());
    window.addEventListener('benthic:tutorial-restart', reload);
    return () => window.removeEventListener('benthic:tutorial-restart', reload);
  }, []);

  const persist = useCallback((next: TutorialProgress) => {
    setProgress(next);
    saveTutorialProgress(next);
  }, []);

  const advance = useCallback(() => {
    setProgress((current) => {
      const nextIndex = current.index + 1;
      const next: TutorialProgress = {
        index: nextIndex,
        done: nextIndex >= TUTORIAL_STEPS.length,
        paused: false,
      };
      saveTutorialProgress(next);
      return next;
    });
    // Only dismiss open sheets when the next target lives outside them,
    // otherwise the player loses the panel the lesson is about.
    const upcoming = TUTORIAL_STEPS[Math.min(progress.index + 1, TUTORIAL_STEPS.length - 1)];
    const target = upcoming?.target ?? '';
    if (!target.startsWith('.sheet') && !target.startsWith('[data-room')) {
      window.dispatchEvent(new CustomEvent('benthic:close-overlays'));
    }
  }, [progress.index]);

  const skip = useCallback(() => {
    persist({ index: TUTORIAL_STEPS.length, done: true, paused: false });
  }, [persist]);

  const pause = useCallback(() => {
    persist({ ...progress, paused: true });
  }, [persist, progress]);

  // measure the highlighted element
  useEffect(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const measure = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const element = document.querySelector(step.target);
      if (!element) {
        setRect(null);
        return;
      }
      const box = element.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) {
        setRect(null);
        return;
      }
      setRect(box);
    };

    measure();
    const timer = window.setInterval(measure, 320);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step, pulse]);

  // camera guidance
  useEffect(() => {
    if (step) focusRoom(step.room);
  }, [step]);

  // completion detection
  useEffect(() => {
    if (!step || step.manual) return;
    const state = sim.state;
    const byAction = step.action ? countOf(step.action) > 0 : false;
    const byState = step.done ? step.done(state) : false;
    if (!byAction && !byState) return;

    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => advance(), 700);
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, [step, pulse, advance]);

  if (!step) return null;

  const cardStyle = rect
    ? rect.y > window.innerHeight * 0.48
      ? { top: '12px', bottom: 'auto' as const }
      : { bottom: '70px', top: 'auto' as const }
    : { top: '50%', transform: 'translateY(-50%)' };

  return (
    <div className="tutorial-layer" aria-live="polite">
      {rect ? (
        <div
          className="tutorial-spotlight"
          style={{
            left: Math.max(0, rect.left - 6),
            top: Math.max(0, rect.top - 6),
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      ) : (
        <div className="tutorial-scrim" />
      )}

      <div className="tutorial-card" style={cardStyle}>
        <div className="tutorial-card__head">
          <GuidePortrait size={54} />
          <div>
            <div className="tutorial-card__name">{GUIDE.name}</div>
            <div className="tutorial-card__role">{GUIDE.role}</div>
          </div>
          <div className="tutorial-card__step">
            {fa(progress.index + 1)} از {fa(TUTORIAL_STEPS.length)}
          </div>
        </div>

        <div className="tutorial-card__title">{TUTORIAL_TITLE} — {step.title}</div>

        {step.lines.map((line, index) => (
          <p key={index} className="tutorial-card__line">
            {line}
          </p>
        ))}

        {step.hint ? <div className="tutorial-card__hint">{step.hint}</div> : null}

        <div className="tutorial-card__actions">
          {step.manual ? (
            <button type="button" className="btn btn--sm btn--primary" onClick={advance}>
              {progress.index === TUTORIAL_STEPS.length - 1 ? 'پایان آموزش' : 'ادامه'}
            </button>
          ) : (
            <>
              <button type="button" className="btn btn--sm btn--primary" onClick={advance}>
                انجام دادم، بعدی
              </button>
              <span className="tutorial-card__waiting">یا خودِ کار را انجام بده…</span>
            </>
          )}
          <button type="button" className="btn btn--sm btn--ghost" onClick={pause}>
            توقف
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={skip}>
            رد کردن آموزش
          </button>
        </div>

        <div className="tutorial-card__progress">
          <div
            className="tutorial-card__progress-fill"
            style={{ width: `${((progress.index + (step.manual ? 0 : 0.4)) / TUTORIAL_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function restartTutorial(): void {
  saveTutorialProgress({ index: 0, done: false, paused: false });
  window.dispatchEvent(new CustomEvent('benthic:tutorial-restart'));
}

export function resumeTutorial(): void {
  const current = loadTutorialProgress();
  if (current.done) {
    restartTutorial();
    return;
  }
  saveTutorialProgress({ ...current, paused: false });
  window.dispatchEvent(new CustomEvent('benthic:tutorial-restart'));
}
