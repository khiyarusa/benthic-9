export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export type ArrowSide = 'up' | 'down' | 'left' | 'right' | null;

export interface Placement {
  left: number;
  top: number;
  arrow: ArrowSide;
  /** true when the card had to fall back to a corner coachmark */
  fallback: boolean;
}

const GAP = 10;

function overlap(a: RectLike, b: RectLike): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

function outside(rect: RectLike, width: number, height: number): number {
  let area = 0;
  if (rect.left < 0) area += (0 - rect.left) * rect.height;
  if (rect.top < 0) area += (0 - rect.top) * rect.width;
  if (rect.right > width) area += (rect.right - width) * rect.height;
  if (rect.bottom > height) area += (rect.bottom - height) * rect.width;
  return area;
}

function make(left: number, top: number, w: number, h: number): RectLike {
  return { left, top, right: left + w, bottom: top + h, width: w, height: h };
}

/**
 * Chooses where a floating coaching card should sit.
 *
 * Hard rules: never overlap the highlighted target, never cover the reserved
 * chrome (top bar, navigation, command bar), always stay on screen. Among the
 * candidates that satisfy those, prefer the closest one to the target so the
 * eye does not have to travel.
 */
export function placeCard(
  target: DOMRect | null,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
  reserved: RectLike[] = [],
): Placement {
  const { width: cw, height: ch } = card;
  const candidates: { left: number; top: number; arrow: ArrowSide }[] = [];

  const clampX = (x: number) => Math.max(8, Math.min(viewport.width - cw - 8, x));
  const clampY = (y: number) => Math.max(8, Math.min(viewport.height - ch - 8, y));

  if (target) {
    candidates.push(
      { left: target.right + GAP, top: target.top + target.height / 2 - ch / 2, arrow: 'left' },
      { left: target.left - cw - GAP, top: target.top + target.height / 2 - ch / 2, arrow: 'right' },
      { left: target.left + target.width / 2 - cw / 2, top: target.bottom + GAP, arrow: 'up' },
      { left: target.left + target.width / 2 - cw / 2, top: target.top - ch - GAP, arrow: 'down' },
    );
  }

  // corners are the fallback coachmarks
  const cornerTop = 52;
  const cornerBottom = viewport.height - ch - 74;
  const corners: { left: number; top: number }[] = [
    { left: viewport.width - cw - 10, top: cornerTop },
    { left: 10, top: cornerTop },
    { left: viewport.width - cw - 10, top: cornerBottom },
    { left: 10, top: cornerBottom },
  ];

  let best: { score: number; left: number; top: number; arrow: ArrowSide; fallback: boolean } | null = null;

  const score = (rect: RectLike, arrow: ArrowSide, isCorner: boolean, distance: number) => {
    let penalty = outside(rect, viewport.width, viewport.height) * 400;
    if (target) penalty += overlap(rect, target) * 1200;
    for (const zone of reserved) penalty += overlap(rect, zone) * 900;
    penalty += distance * 0.04;
    if (isCorner && target) penalty += 240;
    if (best === null || penalty < best.score) {
      best = { score: penalty, left: rect.left, top: rect.top, arrow, fallback: isCorner };
    }
  };

  for (const candidate of candidates) {
    const left = clampX(candidate.left);
    const top = clampY(candidate.top);
    const rect = make(left, top, cw, ch);
    const distance = target
      ? Math.hypot(left - (target.left + target.width / 2), top - (target.top + target.height / 2))
      : 0;
    score(rect, candidate.arrow, false, Math.max(0, distance - 160));
  }

  for (const corner of corners) {
    score(make(corner.left, corner.top, cw, ch), null, true, 0);
  }

  const chosen = best ?? { left: clampX(10), top: clampY(cornerTop), arrow: null as ArrowSide, fallback: true };
  return {
    left: clampX(chosen.left),
    top: clampY(chosen.top),
    arrow: chosen.arrow,
    fallback: chosen.fallback,
  };
}
