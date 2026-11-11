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

export type TexKey = 'seabed' | 'cliff' | 'boulder' | 'plates' | 'rust' | 'walkway';

/** Photographic material atlases, loaded by the scene before the map is baked. */
export interface TexSet {
  images: Partial<Record<TexKey, HTMLImageElement>>;
  patterns: Partial<Record<TexKey, CanvasPattern | null>>;
}

export function makeTexSet(images: Partial<Record<TexKey, HTMLImageElement>>): TexSet {
  const patterns: TexSet['patterns'] = {};
  const probe = surface(8, 8).ctx;
  for (const [key, img] of Object.entries(images)) {
    if (!img) continue;
    patterns[key as TexKey] = probe.createPattern(img, 'repeat');
  }
  return { images, patterns };
}

/** The ROV itself: 26×16, twin thrusters with a cyan glow. */
export function paintRov(): HTMLCanvasElement {
  const { canvas, ctx } = surface(26, 16);
  const b = new Brush(ctx);
  b.rect(3, 5, 18, 7, '#ffb454');
  b.rect(3, 5, 18, 1, '#ffe0ae');
  b.rect(3, 11, 18, 1, '#a8702c');
  b.rect(6, 7, 6, 4, '#08222c');
  b.rect(7, 8, 4, 2, '#4fe0e6', 0.7);
  b.rect(1, 4, 3, 9, '#123642');
  b.rect(20, 4, 3, 9, '#123642');
  b.rect(4, 13, 4, 2, '#123642');
  b.rect(16, 13, 4, 2, '#123642');
  b.rect(0, 2, 3, 4, '#0d2a34');
  b.rect(21, 2, 3, 4, '#0d2a34');
  b.px(0, 3, C.cyan, 0.9);
  b.px(24, 3, C.cyan, 0.9);
  b.rect(1, 9, 2, 2, '#fff2cf');
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


/** Smooth 1D value noise: the backbone of every terrain silhouette. */
function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i, seed, 17);
  const b = hash(i + 1, seed, 17);
  const t = f * f * (3 - 2 * f);
  return a * (1 - t) + b * t;
}

function fbm(x: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let o = 0; o < octaves; o += 1) {
    sum += noise1(x * freq, seed + o * 31) * amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum;
}

/** Fills an arbitrary closed path with a material, then shades it. */
function shadePath(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  pattern: CanvasPattern | null,
  scale: number,
  base: string,
  light: string,
  shadow: string,
  bbox: [number, number, number, number],
): void {
  ctx.save();
  ctx.clip(path);
  if (pattern) {
    pattern.setTransform(new DOMMatrix().scale(scale, scale));
    ctx.fillStyle = pattern;
    ctx.fillRect(bbox[0], bbox[1], bbox[2], bbox[3]);
  } else {
    ctx.fillStyle = base;
    ctx.fillRect(bbox[0], bbox[1], bbox[2], bbox[3]);
  }
  const grad = ctx.createLinearGradient(bbox[0], bbox[1], bbox[0] + bbox[2] * 0.35, bbox[1] + bbox[3]);
  grad.addColorStop(0, light);
  grad.addColorStop(0.45, 'rgba(8, 26, 34, 0.35)');
  grad.addColorStop(1, shadow);
  ctx.fillStyle = grad;
  ctx.fillRect(bbox[0], bbox[1], bbox[2], bbox[3]);
  ctx.restore();
}

/** One continuous cliff wall with a jagged edge, lit from the water side. */
function cliffWall(
  ctx: CanvasRenderingContext2D,
  tex: TexSet,
  side: 'left' | 'right',
  width: number,
  height: number,
  seed: number,
): void {
  const baseW = 46 + noise1(seed * 3.1, seed) * 34;
  const path = new Path2D();
  const steps = 90;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    const y = (i / steps) * height;
    const wobble = fbm(i * 0.16, seed, 4) - 0.5;
    const ledge = Math.sin(i * 0.21 + seed) * 0.18;
    const w = baseW + wobble * 54 + ledge * 30;
    pts.push([y, Math.max(18, w)]);
  }
  if (side === 'left') {
    path.moveTo(0, 0);
    for (const [y, w] of pts) path.lineTo(w, y);
    path.lineTo(0, height);
  } else {
    path.moveTo(width, 0);
    for (const [y, w] of pts) path.lineTo(width - w, y);
    path.lineTo(width, height);
  }
  path.closePath();

  shadePath(ctx, path, tex.patterns.cliff ?? tex.patterns.boulder ?? null, 0.42,
    '#0c2632', 'rgba(150, 205, 225, 0.20)', 'rgba(1, 8, 12, 0.85)', [0, 0, width, height]);

  // rim light: the single strongest realism cue on a dark cliff
  ctx.save();
  ctx.clip(path);
  ctx.strokeStyle = 'rgba(126, 214, 235, 0.30)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  pts.forEach(([y, w], i) => {
    const x = side === 'left' ? w : width - w;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.strokeStyle = 'rgba(126, 214, 235, 0.10)';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.restore();
}

/** Boulder: an irregular blob, not a rectangle. */
function boulder(
  ctx: CanvasRenderingContext2D,
  tex: TexSet,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
): void {
  const path = new Path2D();
  const steps = 14;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const wobble = 0.78 + noise1(i * 0.9 + seed, seed) * 0.42;
    const px = x + Math.cos(a) * (w / 2) * wobble;
    const py = y + Math.sin(a) * (h / 2) * wobble;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.closePath();
  shadePath(ctx, path, tex.patterns.boulder ?? tex.patterns.cliff ?? null, 0.4,
    '#0b222c', 'rgba(140, 200, 222, 0.16)', 'rgba(1, 7, 11, 0.9)', [x - w, y - h, w * 2, h * 2]);
  ctx.save();
  ctx.clip(path);
  ctx.strokeStyle = 'rgba(150, 215, 235, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke(path);
  ctx.restore();
}

function vent(ctx: CanvasRenderingContext2D, tex: TexSet, x: number, y: number, h: number): void {
  const path = new Path2D();
  path.moveTo(x - 4, y);
  path.lineTo(x - 2, y - h);
  path.lineTo(x + 6, y - h - 3);
  path.lineTo(x + 9, y);
  path.closePath();
  shadePath(ctx, path, tex.patterns.rust ?? null, 0.22, '#241814', 'rgba(255, 190, 120, 0.30)', 'rgba(0, 4, 8, 0.9)', [x - 6, y - h - 6, 22, h + 10]);
  // glowing mouth
  ctx.save();
  const glow = ctx.createRadialGradient(x + 2, y - h - 4, 0, x + 2, y - h - 4, 14);
  glow.addColorStop(0, 'rgba(255, 170, 80, 0.55)');
  glow.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 14, y - h - 20, 34, 30);
  ctx.restore();
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = `rgba(190, 235, 245, ${0.16 - i * 0.02})`;
    ctx.beginPath();
    ctx.arc(x + 2 + Math.sin(i * 1.7) * 4, y - h - 8 - i * 9, 2 + i * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function organism(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, kind: number): void {
  if (kind === 0) {
    for (let i = 0; i < 5; i += 1) {
      const hh = 6 + hash(i, 1, seed) * 12;
      ctx.strokeStyle = '#b4554f';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + i * 2.4, y);
      ctx.quadraticCurveTo(x + i * 2.4 + Math.sin(i) * 3, y - hh * 0.6, x + i * 2.4 + Math.sin(i) * 2, y - hh);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 160, 140, 0.9)';
      ctx.beginPath();
      ctx.arc(x + i * 2.4 + Math.sin(i) * 2, y - hh, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 1) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
    g.addColorStop(0, 'rgba(150, 235, 245, 0.45)');
    g.addColorStop(1, 'rgba(150, 235, 245, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(190, 245, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(210, 140, 80, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x, y, 3.2, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 200, 150, 0.7)';
    ctx.lineWidth = 0.8;
    for (const dx of [-4, 4]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx * 1.6, y - 2);
      ctx.stroke();
    }
  }
}

/** One dive map: a vertical trench with a themed floor at the bottom. */
export function paintSeabed(theme: DiveTheme, width: number, height: number, tex?: TexSet): HTMLCanvasElement {
  const { canvas, ctx } = surface(width, height);
  const mats = tex ?? makeTexSet({});
  const floorY = height - 108;

  const water = ctx.createLinearGradient(0, 0, 0, height);
  water.addColorStop(0, '#0d3b4d');
  water.addColorStop(0.3, theme.tint);
  water.addColorStop(0.7, '#04151e');
  water.addColorStop(1, '#02090e');
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, width, height);

  // distant water haze bands, cheap depth cue
  for (let i = 0; i < 5; i += 1) {
    const y = height * (0.12 + i * 0.16);
    const band = ctx.createLinearGradient(0, y - 60, 0, y + 60);
    band.addColorStop(0, 'rgba(90, 170, 195, 0)');
    band.addColorStop(0.5, `rgba(90, 170, 195, ${0.03 - i * 0.004})`);
    band.addColorStop(1, 'rgba(90, 170, 195, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, y - 60, width, 120);
  }

  // floor silhouette from noise, filled with the sand texture
  const floorPath = new Path2D();
  floorPath.moveTo(0, height);
  floorPath.lineTo(0, floorY);
  for (let x = 0; x <= width; x += 8) {
    const n = fbm(x * 0.012, 41, 4) - 0.5;
    floorPath.lineTo(x, floorY + n * 26);
  }
  floorPath.lineTo(width, height);
  floorPath.closePath();
  shadePath(ctx, floorPath, mats.patterns.seabed ?? null, 0.5, '#0a1a22',
    'rgba(170, 215, 230, 0.16)', 'rgba(1, 6, 9, 0.92)', [0, floorY - 40, width, height - floorY + 40]);

  ctx.save();
  ctx.clip(floorPath);
  // ripples: fine sand ridges catching the light
  for (let x = 0; x < width; x += 13) {
    ctx.strokeStyle = `rgba(180, 225, 238, ${0.03 + noise1(x * 0.3, 9) * 0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = floorY - 4; y < height; y += 6) {
      const wx = x + Math.sin(y * 0.08 + x * 0.02) * 4;
      if (y === floorY - 4) ctx.moveTo(wx, y);
      else ctx.lineTo(wx, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  cliffWall(ctx, mats, 'left', width, height, 3);
  cliffWall(ctx, mats, 'right', width, height, 11);

  // boulders rest on the floor
  const rng = (i: number, salt: number) => hash(i, salt, Math.round(theme.depthM / 100));
  for (let i = 0; i < 26; i += 1) {
    const bx = 60 + rng(i, 1) * (width - 120);
    const size = 16 + rng(i, 3) * 46;
    boulder(ctx, mats, bx, floorY + 6 - rng(i, 2) * 10 - size * 0.2, size * 1.35, size * 0.72, i);
  }
  // a few suspended boulders along the walls
  for (let i = 0; i < 8; i += 1) {
    const left = i % 2 === 0;
    const bx = left ? 90 + rng(i, 4) * 120 : width - 90 - rng(i, 4) * 120;
    const by = 200 + rng(i, 5) * (floorY - 320);
    const size = 22 + rng(i, 6) * 40;
    boulder(ctx, mats, bx, by, size * 1.2, size * 0.7, i + 40);
  }

  if (theme.id === 'vents') {
    for (let i = 0; i < 5; i += 1) {
      vent(ctx, mats, 90 + rng(i, 5) * (width - 180), floorY - 6 - rng(i, 6) * 30, 26 + Math.round(rng(i, 7) * 40));
    }
  }
  if (theme.id === 'wreck') {
    for (const [wx, wy, ww] of [
      [60, floorY - 46, Math.round(width * 0.58)],
      [140, floorY - 116, Math.round(width * 0.32)],
    ] as Array<[number, number, number]>) {
      const hull = new Path2D();
      hull.moveTo(wx, wy);
      hull.lineTo(wx + ww, wy);
      hull.lineTo(wx + ww * 0.94, wy + 16);
      hull.lineTo(wx + ww * 0.06, wy + 16);
      hull.closePath();
      shadePath(ctx, hull, mats.patterns.plates ?? null, 0.34, '#122833',
        'rgba(150, 205, 225, 0.22)', 'rgba(0, 5, 8, 0.9)', [wx, wy - 8, ww, 30]);
      ctx.strokeStyle = 'rgba(150, 215, 235, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.stroke(hull);
      // torn superstructure
      ctx.fillStyle = 'rgba(6, 20, 27, 0.95)';
      ctx.fillRect(wx + ww * 0.55, wy - 22, ww * 0.16, 22);
      ctx.fillRect(wx + ww * 0.24, wy - 13, ww * 0.1, 13);
    }
  }
  if (theme.id === 'signal') {
    const sxp = width * 0.52;
    const sy = floorY - 84;
    const mono = new Path2D();
    mono.moveTo(sxp - 12, floorY);
    mono.lineTo(sxp - 5, sy);
    mono.lineTo(sxp + 5, sy);
    mono.lineTo(sxp + 12, floorY);
    mono.closePath();
    shadePath(ctx, mono, mats.patterns.plates ?? null, 0.3, '#14202a',
      'rgba(120, 230, 240, 0.35)', 'rgba(0, 8, 12, 0.9)', [sxp - 16, sy - 6, 34, 96]);
    for (let i = 0; i < 3; i += 1) {
      ctx.strokeStyle = `rgba(79, 224, 230, ${0.34 - i * 0.1})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(sxp, sy, 18 + i * 12, 6 + i * 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (theme.id === 'canyon') {
    for (let i = 0; i < 4; i += 1) {
      boulder(ctx, mats, width * 0.22 + i * 46, floorY - 50 - i * 22, 44, 66 + i * 16, i * 9);
    }
  }

  for (let i = 0; i < 26; i += 1) {
    organism(ctx, 90 + rng(i, 8) * (width - 180), floorY + 4 - rng(i, 9) * 14, i, i % 3);
  }

  for (let i = 0; i < 420; i += 1) {
    const px = rng(i, 10) * width;
    const py = rng(i, 11) * height;
    ctx.fillStyle = `rgba(190, 230, 240, ${0.03 + rng(i, 12) * 0.1})`;
    ctx.fillRect(px, py, 1.4, 1.4);
  }

  // Light shafts: one soft offscreen cone per shaft, masked vertically so
  // there is no banding and no hard edge.
  for (let i = 0; i < 4; i += 1) {
    const canvasH = Math.round(height * (0.58 + i * 0.05));
    const cone = surface(180, canvasH);
    const cx = 90;
    const topW = 18 + i * 5;
    const bottomW = topW * 3.4;
    const grad = cone.ctx.createLinearGradient(cx - bottomW / 2, 0, cx + bottomW / 2, 0);
    grad.addColorStop(0, 'rgba(150, 225, 245, 0)');
    grad.addColorStop(0.5, 'rgba(150, 225, 245, 0.16)');
    grad.addColorStop(1, 'rgba(150, 225, 245, 0)');
    cone.ctx.fillStyle = grad;
    cone.ctx.beginPath();
    cone.ctx.moveTo(cx - topW / 2, 0);
    cone.ctx.lineTo(cx + topW / 2, 0);
    cone.ctx.lineTo(cx + bottomW / 2, canvasH);
    cone.ctx.lineTo(cx - bottomW / 2, canvasH);
    cone.ctx.closePath();
    cone.ctx.fill();
    cone.ctx.globalCompositeOperation = 'destination-in';
    const mask = cone.ctx.createLinearGradient(0, 0, 0, canvasH);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.45, 'rgba(0,0,0,0.55)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    cone.ctx.fillStyle = mask;
    cone.ctx.fillRect(0, 0, 180, canvasH);
    cone.ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(cone.canvas, width * (0.18 + i * 0.17) - 90, 0);
  }
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}


/** Tileable caustics: every blob is drawn with wrap-around copies so the tiling has no seams. */
export function paintCaustics(size = 256): HTMLCanvasElement {
  const { canvas, ctx } = surface(size, size);
  for (let i = 0; i < 70; i += 1) {
    const x = hash(i, 1, 3) * size;
    const y = hash(i, 2, 3) * size;
    const r = 10 + hash(i, 3, 3) * 30;
    const strength = 0.05 + hash(i, 4, 3) * 0.07;
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        const cx = x + ox * size;
        const cy = y + oy * size;
        if (cx + r < 0 || cx - r > size || cy + r < 0 || cy - r > size) continue;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(150, 230, 245, ${strength})`);
        grad.addColorStop(0.55, `rgba(120, 210, 235, ${strength * 0.45})`);
        grad.addColorStop(1, 'rgba(120, 210, 235, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  return canvas;
}
