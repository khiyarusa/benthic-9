import { useEffect, useRef, useState } from 'react';
import { createDiveGame, type DiveHandle } from '../../game/dive/createDiveGame';
import { DIVE_THEMES, type DiveTheme } from '../../game/dive/scenery';
import type { DiveHud, DiveResult } from '../../game/dive/DiveScene';
import { fa } from '../../sim';

const move = (nx: number, ny: number) =>
  window.dispatchEvent(new CustomEvent('dive:move', { detail: { nx, ny } }));

/**
 * Full-screen dive: Phaser renders the trench, React renders instruments and
 * touch controls. Control is event-based so it cannot hold a stale scene ref.
 */
export function DiveOverlay({
  themeId,
  battery,
  hull,
  onFinish,
  onAbort,
}: {
  themeId: DiveTheme['id'];
  battery: number;
  hull: number;
  onFinish: (result: DiveResult) => void;
  onAbort: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<DiveHandle | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [hud, setHud] = useState<DiveHud | null>(null);
  const theme = DIVE_THEMES.find((entry) => entry.id === themeId) ?? DIVE_THEMES[0]!;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let handle: DiveHandle | null = null;

    const boot = async () => {
      try {
        await document.fonts.load('16px Vazirmatn');
      } catch {
        /* best effort */
      }
      if (disposed) return;
      handle = createDiveGame(host, themeId, battery, hull);
      handleRef.current = handle;
    };
    void boot();

    const onHud = (event: Event) => {
      const detail = (event as CustomEvent<DiveHud>).detail;
      if (detail) setHud(detail);
    };
    const onFinished = (event: Event) => {
      const detail = (event as CustomEvent<DiveResult>).detail;
      if (detail) finishRef.current(detail);
    };
    window.addEventListener('dive:hud', onHud);
    window.addEventListener('dive:finished', onFinished);

    return () => {
      disposed = true;
      window.removeEventListener('dive:hud', onHud);
      window.removeEventListener('dive:finished', onFinished);
      handle?.game.destroy(true);
      handleRef.current = null;
    };
  }, [themeId, battery, hull]);

  const pointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    move((event.clientX - rect.left) / Math.max(1, rect.width), (event.clientY - rect.top) / Math.max(1, rect.height));
  };

  return (
    <div className="dive">
      <div
        className="dive__stage"
        ref={hostRef}
        onPointerDown={pointer}
        onPointerMove={(event) => {
          if (event.buttons !== 0 || event.pointerType === 'touch') pointer(event);
        }}
      />

      <div className="dive__top">
        <div className="dive__theme">
          <strong>{theme.label}</strong>
          <span>
            هدف {fa(theme.depthM)} متر · عمق فعلی {fa(hud?.depthM ?? 600)} متر
          </span>
        </div>
        <div className="dive__stats">
          <span className={hud && hud.battery < 20 ? 'is-danger' : ''}>باتری {fa(hud?.battery ?? 100)}٪</span>
          <span className={hud && hud.hull < 45 ? 'is-danger' : ''}>بدنه {fa(hud?.hull ?? 100)}٪</span>
          <span>نمونه {fa(hud?.samples ?? 0)}</span>
          <span>داده {fa(hud?.data ?? 0)}</span>
          <span>کابل {fa(hud?.tether ?? 0)}٪</span>
        </div>
      </div>

      {hud?.warning ? <div className="dive__warning">{hud.warning}</div> : null}

      <div className="dive__hint">برای حرکت، روی آب ضربه بزن یا انگشت را بکش</div>

      <div className="dive__controls">
        <button type="button" className="dive__btn" onClick={() => window.dispatchEvent(new CustomEvent('dive:lights'))}>
          نور {hud?.lights ? 'روشن' : 'خاموش'}
        </button>
        <button
          type="button"
          className="dive__btn"
          disabled={Boolean(hud && !hud.sonarReady)}
          onClick={() => window.dispatchEvent(new CustomEvent('dive:sonar'))}
        >
          سونار
        </button>
        <button
          type="button"
          className="dive__btn dive__btn--primary"
          onClick={() => window.dispatchEvent(new CustomEvent('dive:surface'))}
        >
          بازگشت به ایستگاه
        </button>
        <button type="button" className="dive__btn dive__btn--ghost" onClick={onAbort}>
          لغو
        </button>
      </div>

      {hud && hud.discoveries.length > 0 ? (
        <div className="dive__found">کشف تازه: {fa(hud.discoveries.length)} مورد ثبت شد</div>
      ) : null}
    </div>
  );
}
