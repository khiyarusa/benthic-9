import { Brush, C, hash, surface } from './painter';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The water outside the hull: vertical gradient, distant geology, a derelict and
 * soft light shafts. Painted once per resize and used as the scene backdrop.
 */
export function paintBackdrop(w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h);
  const b = new Brush(ctx);

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0c3749');
  g.addColorStop(0.3, '#072231');
  g.addColorStop(0.7, '#03131c');
  g.addColorStop(1, '#01070c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // distant ridge, only visible in the margins
  for (let x = 0; x < w; x += 8) {
    const bump = Math.sin(x * 0.012) * 6 + Math.sin(x * 0.041) * 3;
    b.rect(x, h * 0.9 + bump, 8, h, '#061c26', 0.75);
  }

  // light shafts
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i += 1) {
    const sx = w * (0.05 + i * 0.18) + hash(i, 1, 7) * 24;
    const spread = 34 + hash(i, 2, 7) * 54;
    const shaft = ctx.createLinearGradient(sx, 0, sx + spread * 0.6, h);
    shaft.addColorStop(0, 'rgba(126, 216, 235, 0.10)');
    shaft.addColorStop(0.6, 'rgba(90, 190, 214, 0.03)');
    shaft.addColorStop(1, 'rgba(60, 150, 180, 0)');
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(sx, -8);
    ctx.lineTo(sx + spread * 0.22, -8);
    ctx.lineTo(sx + spread, h);
    ctx.lineTo(sx + spread * 0.6, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  for (let i = 0; i < 90; i += 1) {
    const px = Math.floor(hash(i, 1, 91) * w);
    const py = Math.floor(hash(i, 2, 91) * h);
    b.px(px, py, '#9fd8e6', 0.05 + hash(i, 3, 91) * 0.1);
  }

  return canvas;
}

/**
 * The vessel itself, seen from outside: pressure hull, sail, masts, dive planes,
 * hangar door, floodlights, bubbles and the sea above it. This strip is what
 * makes the cutaway read as a real boat instead of a floor plan.
 */
export function paintExterior(w: number, stripH: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, stripH);
  const b = new Brush(ctx);

  // water above the hull
  const water = ctx.createLinearGradient(0, 0, 0, stripH);
  water.addColorStop(0, '#0d3d51');
  water.addColorStop(0.55, '#082736');
  water.addColorStop(1, '#051a25');
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, w, stripH);

  // surface shimmer near the top edge
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 10; i += 1) {
    const sx = w * (0.02 + i * 0.1);
    b.rect(sx, 0, 3 + (i % 3) * 2, stripH * 0.5, '#63c9e2', 0.035);
  }
  ctx.globalCompositeOperation = 'source-over';

  // fish above the hull
  for (let i = 0; i < 5; i += 1) {
    const fx = hash(i, 3, 12) * w;
    const fy = 4 + hash(i, 4, 12) * (stripH * 0.4);
    const size = 3 + Math.floor(hash(i, 5, 12) * 4);
    b.rect(fx, fy, size, 2, '#08222c', 0.9);
    b.rect(fx + size, fy - 1, 2, 4, '#08222c', 0.9);
    b.px(fx + size - 1, fy, '#0b3644', 0.6);
  }

  // float line / ballast foam
  for (let i = 0; i < 26; i += 1) {
    const bx = (w / 26) * i + hash(i, 1, 5) * 10;
    b.px(bx, stripH * 0.45 + hash(i, 2, 5) * 4, '#7fd8e8', 0.06);
  }

  const hullTop = Math.round(stripH * 0.62);
  const hullBottom = stripH;

  // dive planes (wings) behind the sail
  b.rect(w * 0.16, hullTop + 3, w * 0.1, 3, C.hullLight, 0.9);
  b.rect(w * 0.72, hullTop + 3, w * 0.11, 3, C.hullLight, 0.9);

  // main dorsal hull
  const hullGrad = ctx.createLinearGradient(0, hullTop, 0, hullBottom);
  hullGrad.addColorStop(0, '#16414f');
  hullGrad.addColorStop(0.35, '#0d2a34');
  hullGrad.addColorStop(1, '#071a22');
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(0, hullBottom);
  ctx.lineTo(w * 0.06, hullTop + 2);
  ctx.lineTo(w * 0.5, hullTop - 2);
  ctx.lineTo(w * 0.94, hullTop + 2);
  ctx.lineTo(w, hullBottom);
  ctx.closePath();
  ctx.fill();

  // hull rim light
  b.line(w * 0.06, hullTop + 2, w * 0.5, hullTop - 2, C.frameLight, 1, 0.55);
  b.line(w * 0.5, hullTop - 2, w * 0.94, hullTop + 2, C.frameLight, 1, 0.55);

  // plating seams
  for (let x = w * 0.08; x < w * 0.95; x += 34) {
    b.vline(x, hullTop + 3, hullBottom - hullTop, C.ink, 0.35);
  }
  for (let x = w * 0.1; x < w * 0.93; x += 9) {
    b.px(x, hullTop + 5, C.steelLight, 0.45);
  }

  // conning tower / sail
  const sailX = w * 0.42;
  const sailW = Math.max(26, w * 0.075);
  const sailTop = hullTop - Math.max(10, stripH * 0.26);
  b.bevel(sailX, sailTop, sailW, hullTop - sailTop + 3, '#0e303c', C.frameLight, C.ink);
  b.rect(sailX + 3, sailTop + 4, sailW - 6, 3, '#123a48');
  b.rect(sailX + 4, sailTop + 9, sailW - 8, Math.max(2, stripH * 0.06), C.ink, 0.55);
  // periscope + antennas
  b.rect(sailX + Math.round(sailW * 0.4), sailTop - 12, 2, 12, C.steel);
  b.rect(sailX + Math.round(sailW * 0.4) - 3, sailTop - 13, 8, 2, C.steel);
  b.px(sailX + Math.round(sailW * 0.4) - 1, sailTop - 14, C.red, 0.8);
  b.rect(sailX + Math.round(sailW * 0.72), sailTop - 8, 1, 8, C.steelLight);
  b.px(sailX + Math.round(sailW * 0.72), sailTop - 9, C.amber, 0.7);

  // navigation lights
  b.rect(6, hullTop + 4, 3, 2, C.green, 0.9);
  b.glow(7, hullTop + 5, 8, C.green, 0.2);
  b.rect(w - 9, hullTop + 4, 3, 2, C.red, 0.9);
  b.glow(w - 8, hullTop + 5, 8, C.red, 0.18);

  // floodlights on the hull
  for (let i = 0; i < 4; i += 1) {
    const lx = w * (0.1 + i * 0.24);
    b.rect(lx, hullTop + 8, 6, 3, C.steel);
    b.rect(lx + 1, hullTop + 9, 4, 1, C.warm, 0.9);
    b.glow(lx + 3, hullTop + 10, 12, C.warm, 0.16);
  }

  // ROV hangar door
  const hx = w * 0.8;
  b.bevel(hx, hullTop + 6, w * 0.09, stripH - hullTop - 6, '#0a2530', C.frameLight, C.ink);
  for (let i = 0; i < 3; i += 1) {
    b.rect(hx + 2, hullTop + 10 + i * 5, w * 0.09 - 4, 2, C.amber, 0.25);
  }

  // bubbles rising off the hull
  for (let i = 0; i < 14; i += 1) {
    const bx = hash(i, 1, 31) * w;
    const by = hullTop - 2 - hash(i, 2, 31) * (stripH * 0.3);
    const r = hash(i, 3, 31) > 0.6 ? 2 : 1;
    b.circle(bx, by, r, C.glass, 0.14);
  }

  // bottom edge merges into the cutaway
  b.rect(0, stripH - 2, w, 2, C.ink, 0.9);
  return canvas;
}

/** Structural frame and keel around the room grid. */
export function paintShell(w: number, h: number, box: Box): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h);
  const b = new Brush(ctx);
  const x = box.x - 7;
  const y = box.y - 6;
  const hw = box.w + 14;
  const hh = box.h + 12;

  b.bevel(x, y, hw, hh, C.hull, C.frameLight, C.ink);
  b.frame(x + 2, y + 2, hw - 4, hh - 4, C.ink, 0.5);

  // transverse ribs between decks
  for (let sx = x + 26; sx < x + hw - 6; sx += 48) {
    b.vline(sx, y + 2, hh - 4, C.ink, 0.28);
    b.vline(sx + 1, y + 2, hh - 4, '#1a4756', 0.22);
  }

  // rivets along the rim
  for (let rx = x + 6; rx < x + hw - 4; rx += 10) {
    b.px(rx, y + 4, C.steelLight, 0.55);
    b.px(rx, y + hh - 5, C.steelLight, 0.55);
  }

  // keel with ballast skids
  b.rect(x + 4, y + hh, hw - 8, 6, C.hullDark);
  b.hline(x + 4, y + hh, hw - 8, C.frameLight, 0.5);
  for (let i = 0; i < 3; i += 1) {
    const sx = x + hw * (0.16 + i * 0.3);
    b.bevel(sx, y + hh + 2, 24, 4, C.steel, C.steelLight, C.ink);
  }

  // bow and stern caps
  b.rect(x - 6, y + hh * 0.26, 7, hh * 0.48, C.hullDark);
  b.rect(x - 6, y + hh * 0.26, 7, 2, C.frameLight, 0.6);
  b.rect(x + hw - 1, y + hh * 0.26, 7, hh * 0.48, C.hullDark);
  b.rect(x + hw - 1, y + hh * 0.26, 7, 2, C.frameLight, 0.6);

  // wear
  b.speckle(x + 4, y + 4, hw - 8, hh - 8, C.rust, 50, 17, 0.14);
  return canvas;
}

/** Soft inner shadow, keeps the rooms sunk into the hull. */
export function paintInnerShadow(w: number, h: number, box: Box): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h);
  const vg = ctx.createRadialGradient(
    box.x + box.w / 2,
    box.y + box.h / 2,
    Math.min(box.w, box.h) * 0.42,
    box.x + box.w / 2,
    box.y + box.h / 2,
    Math.max(box.w, box.h) * 0.8,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(box.x - 20, box.y - 20, box.w + 40, box.h + 40);
  return canvas;
}

/** Floodlight cones cast down from the exterior strip onto the hull rim. */
export function paintBeams(w: number, h: number, stripH: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i += 1) {
    const lx = w * (0.1 + i * 0.24);
    const ly = stripH * 0.62 + 9;
    const len = stripH * 0.55;
    const cone = ctx.createLinearGradient(lx, ly, lx, ly + len);
    cone.addColorStop(0, 'rgba(255, 226, 176, 0.20)');
    cone.addColorStop(1, 'rgba(255, 226, 176, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 6, ly);
    ctx.lineTo(lx + 14 + len * 0.4, ly + len);
    ctx.lineTo(lx - 10 - len * 0.3, ly + len);
    ctx.closePath();
    ctx.fill();
  }
  return canvas;
}

/** Final grade: vignette, cool shadows, warm highlights and a hint of grain. */
export function paintGrade(w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h);
  const b = new Brush(ctx);

  const vg = ctx.createRadialGradient(w / 2, h * 0.52, Math.min(w, h) * 0.3, w / 2, h * 0.52, Math.max(w, h) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(0.72, 'rgba(1,8,12,0.22)');
  vg.addColorStop(1, 'rgba(0,4,7,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // cool tint at the edges, warm in the middle
  ctx.globalCompositeOperation = 'soft-light';
  const tint = ctx.createLinearGradient(0, 0, 0, h);
  tint.addColorStop(0, 'rgba(20, 90, 110, 0.35)');
  tint.addColorStop(0.5, 'rgba(255, 190, 130, 0.10)');
  tint.addColorStop(1, 'rgba(6, 40, 60, 0.4)');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // grain
  for (let i = 0; i < Math.round(w * h * 0.0016); i += 1) {
    const x = Math.floor(hash(i, 1, 71) * w);
    const y = Math.floor(hash(i, 2, 71) * h);
    b.px(x, y, hash(i, 3, 71) > 0.5 ? '#9fd8e6' : '#040d12', 0.05);
  }

  return canvas;
}
