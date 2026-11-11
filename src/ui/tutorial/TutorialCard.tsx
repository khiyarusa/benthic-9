import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GUIDE, TUTORIAL_TITLE, type TutorialStep } from './steps';
import { placeCard, type Placement } from './placement';
import { GuidePortrait } from './GuidePortrait';

interface Props {
  step: TutorialStep;
  index: number;
  total: number;
  target: DOMRect | null;
  onAdvance: () => void;
  onSkip: () => void;
  onMinimize: () => void;
}

const RESERVED_SELECTORS = ['[data-ui="topbar"]', '[data-ui="nav"]', '[data-ui="next-action"]', '[data-ui="sheet"]'];

/**
 * Compact floating coaching card. It measures itself, then asks the placement
 * solver for a spot that does not cover the highlighted control or the chrome.
 */
export function TutorialCard({ step, index, total, target, onAdvance, onSkip, onMinimize }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 300, height: 132 });
  const [placement, setPlacement] = useState<Placement>({ left: 12, top: 60, arrow: null, fallback: true });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && Math.abs(rect.width - size.width) > 1) {
      setSize({ width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
    }
  }, [step.id, size.width]);

  useEffect(() => {
    const compute = () => {
      const reserved = RESERVED_SELECTORS.map((selector) => document.querySelector(selector))
        .filter((node): node is Element => node !== null)
        .map((node) => node.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0);
      setPlacement(
        placeCard(target, size, { width: window.innerWidth, height: window.innerHeight }, reserved),
      );
    };
    compute();
    const timer = window.setInterval(compute, 400);
    window.addEventListener('resize', compute);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', compute);
    };
  }, [target, size]);

  const arrowStyle = useMemo(() => {
    if (!target || placement.arrow === null) return undefined;
    const cx = target.left + target.width / 2;
    const cy = target.top + target.height / 2;
    if (placement.arrow === 'up' || placement.arrow === 'down') {
      const x = Math.max(14, Math.min(size.width - 24, cx - placement.left));
      return placement.arrow === 'up'
        ? { left: x, top: -6, transform: 'rotate(45deg)' }
        : { left: x, top: size.height - 6, transform: 'rotate(45deg)' };
    }
    const y = Math.max(14, Math.min(size.height - 20, cy - placement.top));
    return placement.arrow === 'left'
      ? { left: -6, top: y, transform: 'rotate(45deg)' }
      : { left: size.width - 6, top: y, transform: 'rotate(45deg)' };
  }, [target, placement, size]);

  return (
    <div
      ref={ref}
      className={`coach ${placement.fallback ? 'coach--fallback' : ''}`}
      style={{ left: placement.left, top: placement.top }}
      role="dialog"
      aria-label={`${TUTORIAL_TITLE} — ${step.title}`}
    >
      {arrowStyle ? <span className="coach__arrow" style={arrowStyle} aria-hidden="true" /> : null}

      <div className="coach__head">
        <GuidePortrait size={30} />
        <div className="coach__titles">
          <strong>{step.title}</strong>
          <span>
            {GUIDE.name} · {index + 1} از {total}
          </span>
        </div>
        <button type="button" className="coach__icon" onClick={onMinimize} aria-label="کوچک کردن راهنما">
          −
        </button>
      </div>

      <div className="coach__body">
        {step.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        {!target && step.fallback ? <p className="coach__where">{step.fallback}</p> : null}
      </div>

      <div className="coach__foot">
        <button type="button" className="btn btn--sm btn--primary" onClick={onAdvance}>
          {step.completion.manual ? 'ادامه' : 'انجام دادم'}
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={onSkip}>
          رد کردن
        </button>
        <span className="coach__dots" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <i key={i} className={i <= index ? 'is-on' : ''} />
          ))}
        </span>
      </div>
    </div>
  );
}
