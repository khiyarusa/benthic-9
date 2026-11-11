import { Brush, C, hash, surface } from '../art/painter';

export interface DiveTheme {
  id: 'canyon' | 'vents' | 'wreck' | 'plain' | 'signal';
  label: string;
  depthM: number;
  hazard: number;
  richness: number;
  tint: string;
}

export const DIVE_THEMES: DiveTheme[] = [
  { id: 'canyon', label: 'درهٔ تاریک', depthM: 3400, hazard: 0.25, richness: 0.5, tint: '#0a2b3a' },
  { id: 'vents', label: 'میدان چشمه‌های گرمابی', depthM: 4200, hazard: 0.45, richness: 0.8, tint: '#123039' },
  { id: 'wreck', label: 'لاشهٔ تحقیقاتی', depthM: 4800, hazard: 0.55, richness: 0.75, tint: '#0c2836' },
  { id: 'plain', label: 'دشت سنگی اعماق', depthM: 5200, hazard: 0.3, richness: 0.45, tint: '#081f2b' },
  { id: 'signal', label: 'منطقهٔ سیگنال ناشناس', depthM: 5600, hazard: 0.65, richness: 0.9, tint: '#0b2438' },
];

/** The ROV itself: 26×16, twin thrusters with a cyan glow. */
export function paintRov(): HTMLCanvasElement {
  const { canvas, ctx } = surface(26, 16);
  const b = new Brush(ctx);
  b.rect(3, 5, 18, 7, '#ffb454');
  b.rect(3, 5, 18, 1, '#ffe0ae');
  b.rect(3, 11, 18, 1, '#a8702c');
  // cockpit glass
  b.rect(6, 7, 6, 4, '#08222c');
  b.rect(7, 8, 4, 2, '#4fe0e6', 0.7);
  // frame + skids
  b.rect(1, 4, 3, 9, '#123642');
  b.rect(20, 4, 3, 9, '#123642');
  b.rect(4, 13, 4, 2, '#123642');
  b.rect(16, 13, 4, 2, '#123642');
  // thrusters
  b.rect(0, 2, 3, 4, '#0d2a34');
  b.rect(21, 2, 3, 4, '#0d2a34');
  b.px(0, 3, C.cyan, 0.9);
  b.px(24, 3, C.cyan, 0.9);
  // lamp
  b.rect(1, 9, 2, 2, '#fff2cf');
  // arm
  b.rect(24, 8, 2, 2, '#c9dbe1');
  return canvas;
}

/** Dark water with a soft hole in the middle: the ROV's lamp pool. */
export function paintDarkness(size = 512): HTMLCanvasElement {
  const { canvas, ctx } = surface(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.04, size / 2, size / 2, size * 0.5);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(0.35, 'rgba(0, 4, 8, 0.28)');
  g.addColorStop(0.7, 'rgba(0, 3, 6, 0.72)');
  g.addColorStop(1, 'rgba(0, 2, 5, 0.94)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function rock(b: Brush, x: number, y: number, w: number, h: number, seed: number): void {
  b.rect(x, y + h - 4, w, 4, '#04141c');
  const layers = Math.max(3, Math.round(h / 5));
  for (let i = 0; i < layers; i += 1) {
    const t = i / layers;
    const inset = Math.round(w * 0.5 * (1 - Math.sin(Math.PI * (0.15 + t * 0.75))) * 0.55);
    b.rect(x + inset, y + Math.round(t * h), w - inset * 2, Math.max(1, Math.round(h / layers)), i < 2 ? '#123845' : '#0a2531');
  }
  b.rect(x + Math.round(w * 0.2), y + 1, Math.round(w * 0.4), 1, '#2a6577', 0.5);
  b.speckle(x + 2, y + 2, w - 4, h - 4, '#3f8299', 10, seed, 0.18);
}

function vent(b: Brush, x: number, y: number, h: number): void {
  b.rect(x, y - h, 8, h, '#123039');
  b.rect(x + 2, y - h, 4, 2, '#ffb454');
  b.rect(x - 2, y - 4, 12, 4, '#0d2a34');
  for (let i = 0; i < 5; i += 1) {
    b.rect(x + 2 + (i % 3) * 2, y - h - 4 - i * 7, 2, 4, '#7fd8e8', 0.18);
  }
}

function organism(b: Brush, x: number, y: number, seed: number, kind: number): void {
  if (kind === 0) {
    // tube worms
    for (let i = 0; i < 4; i += 1) {
      const hh = 4 + Math.floor(hash(i, 1, seed) * 7);
      b.rect(x + i * 2, y - hh, 2, hh, '#c96a6a');
      b.px(x + i * 2, y - hh - 1, '#ffb3a0', 0.9);
    }
  } else if (kind === 1) {
    // jellyfish
    b.circle(x, y, 3, '#7fd8e8', 0.35);
    b.rect(x - 2, y + 2, 1, 3, '#7fd8e8', 0.25);
    b.rect(x, y + 2, 1, 4, '#7fd8e8', 0.25);
    b.rect(x + 2, y + 2, 1, 3, '#7fd8e8', 0.25);
  } else {
    // crustacean
    b.rect(x, y, 5, 2, '#d98c4a');
    b.px(x - 1, y, '#ffd9a0');
    b.px(x + 5, y, '#ffd9a0');
  }
}

function wreck(b: Brush, x: number, y: number, w: number): void {
  b.rect(x, y, w, 10, '#123845');
  b.rect(x, y, w, 2, '#2a6577');
  b.rect(x + w * 0.2, y - 12, w * 0.12, 12, '#0d2a34');
  b.rect(x + w * 0.5, y + 3, 10, 6, '#04141c');
  b.rect(x + w * 0.7, y - 5, w * 0.06, 5, '#0d2a34');
  b.line(x, y + 2, x + w * 0.2, y - 3, '#3f8299', 1, 0.45);
  b.speckle(x, y, w, 10, '#7a4a2c', 30, 9, 0.3);
}

/** One dive map: a vertical trench with a themed floor at the bottom. */
export function paintSeabed(theme: DiveTheme, width: number, height: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(width, height);
  const b = new Brush(ctx);

  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#0b3142');
  g.addColorStop(0.35, theme.tint);
  g.addColorStop(0.75, '#04141d');
  g.addColorStop(1, '#020a10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // cliff walls left/right
  for (let side = 0; side < 2; side += 1) {
    const baseX = side === 0 ? 0 : width - 70;
    for (let y = 0; y < height; y += 40) {
      const w = 26 + Math.round(hash(y, side, 4) * 44);
      rock(b, side === 0 ? baseX : baseX + 70 - w, y + 20, w, 52, y + side);
    }
  }

  // floor
  const floorY = height - 120;
  b.rect(0, floorY, width, 120, '#031019');
  for (let x = 0; x < width; x += 9) {
    const hh = 6 + Math.round(hash(x, 1, 6) * 16);
    b.rect(x, floorY - hh * 0.4, 9, hh, '#061c26');
  }

  const rng = (i: number, salt: number) => hash(i, salt, Math.round(theme.depthM / 100));

  // scattered rocks
  for (let i = 0; i < 44; i += 1) {
    const rx = 40 + rng(i, 1) * (width - 120);
    const ry = 120 + rng(i, 2) * (height - 260);
    const rw = 22 + Math.round(rng(i, 3) * 52);
    const rh = 14 + Math.round(rng(i, 4) * 34);
    rock(b, rx, ry, rw, rh, i);
  }

  // themed set pieces
  if (theme.id === 'vents') {
    for (let i = 0; i < 5; i += 1) {
      vent(b, 60 + rng(i, 5) * (width - 140), floorY - 10 - rng(i, 6) * 40, 18 + Math.round(rng(i, 7) * 26));
    }
  }
  if (theme.id === 'wreck') {
    wreck(b, 50, floorY - 40, Math.round(width * 0.6));
    wreck(b, 120, floorY - 110, Math.round(width * 0.34));
  }
  if (theme.id === 'signal') {
    const sxp = width * 0.5;
    b.rect(sxp - 3, floorY - 70, 6, 70, '#123845');
    b.ring(sxp, floorY - 78, 16, '#4fe0e6', 0.35);
    b.ring(sxp, floorY - 78, 26, '#4fe0e6', 0.2);
    b.ring(sxp, floorY - 78, 36, '#4fe0e6', 0.12);
  }
  if (theme.id === 'canyon') {
    for (let i = 0; i < 4; i += 1) {
      b.rect(width * 0.2 + i * 40, floorY - 60 - i * 18, 26, 60 + i * 18, '#08202a');
    }
  }

  // organisms
  for (let i = 0; i < 16; i += 1) {
    const ox = 40 + rng(i, 8) * (width - 100);
    const oy = floorY - 6 - rng(i, 9) * 30;
    organism(b, ox, oy, i, i % 3);
  }

  // marine snow
  for (let i = 0; i < 260; i += 1) {
    b.px(rng(i, 10) * width, rng(i, 11) * height, '#9fd8e6', 0.05 + rng(i, 12) * 0.12);
  }

  // light shafts from above
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i += 1) {
    const sx = width * (0.2 + i * 0.2);
    const shaft = ctx.createLinearGradient(sx, 0, sx + 40, height * 0.7);
    shaft.addColorStop(0, 'rgba(126, 216, 235, 0.10)');
    shaft.addColorStop(1, 'rgba(126, 216, 235, 0)');
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + 30, 0);
    ctx.lineTo(sx + 90, height * 0.7);
    ctx.lineTo(sx + 40, height * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}
