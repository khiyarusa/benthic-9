/**
 * Pixel-art painter.
 *
 * Everything in the station used to be drawn with Phaser Graphics primitives on
 * every frame. That produced flat rectangles and a heavy draw bill. This module
 * paints real pixel art into an offscreen canvas once, so the scene can blit a
 * handful of textures and only redraw the live state (water, damage, crew).
 */

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export function surface(width: number, height: number): Surface {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is unavailable');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export const C = {
  abyss: '#02080d',
  deep: '#04121a',
  water: '#092c3b',
  hullDark: '#071a22',
  hull: '#0d2a34',
  hullLight: '#16414f',
  frame: '#24586a',
  frameLight: '#3f8299',
  panel: '#0f3341',
  panelLight: '#1b4c5c',
  floor: '#0a212b',
  floorLight: '#123845',
  steel: '#2b4350',
  steelLight: '#4a6b79',
  cyan: '#4fe0e6',
  cyanDim: '#2a8c93',
  amber: '#ffb454',
  amberDim: '#a8702c',
  red: '#ff5f4f',
  redDim: '#9c372c',
  green: '#6fe3a6',
  greenDim: '#2f7a56',
  warm: '#ffd9a0',
  white: '#e8f6fa',
  glass: '#7fd8e8',
  ink: '#020d13',
  rust: '#7a4a2c',
} as const;

/** Deterministic hash noise so a repaint always looks identical. */
export function hash(x: number, y: number, seed = 0): number {
  let h = x * 374761393 + y * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Brush {
  constructor(public ctx: CanvasRenderingContext2D, public ox = 0, public oy = 0) {}

  rect(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    if (w <= 0 || h <= 0) return;
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(this.ox + x), Math.round(this.oy + y), Math.round(w), Math.round(h));
    this.ctx.globalAlpha = 1;
  }

  px(x: number, y: number, color: string, alpha = 1): void {
    this.rect(x, y, 1, 1, color, alpha);
  }

  frame(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    this.rect(x, y, w, 1, color, alpha);
    this.rect(x, y + h - 1, w, 1, color, alpha);
    this.rect(x, y, 1, h, color, alpha);
    this.rect(x + w - 1, y, 1, h, color, alpha);
  }

  /** Plate with a light top/left edge and a dark bottom/right edge. */
  bevel(x: number, y: number, w: number, h: number, base: string, light: string, dark: string): void {
    this.rect(x, y, w, h, base);
    this.rect(x, y, w, 1, light);
    this.rect(x, y, 1, h, light);
    this.rect(x, y + h - 1, w, 1, dark);
    this.rect(x + w - 1, y, 1, h, dark);
  }

  rivets(x: number, y: number, w: number, h: number, color: string, gap = 9): void {
    for (let rx = x + 4; rx < x + w - 2; rx += gap) {
      this.px(rx, y + 2, color, 0.9);
      this.px(rx, y + h - 3, color, 0.9);
    }
    for (let ry = y + 6; ry < y + h - 4; ry += gap) {
      this.px(x + 2, ry, color, 0.75);
      this.px(x + w - 3, ry, color, 0.75);
    }
  }

  /** 50 percent dither, the cheap way to fake a gradient in pixel art. */
  dither(x: number, y: number, w: number, h: number, color: string, step = 2, alpha = 0.5): void {
    for (let yy = 0; yy < h; yy += step) {
      for (let xx = (yy / step) % 2 === 0 ? 0 : step - 1; xx < w; xx += step * 2) {
        this.px(x + xx, y + yy, color, alpha);
      }
    }
  }

  hline(x: number, y: number, w: number, color: string, alpha = 1): void {
    this.rect(x, y, w, 1, color, alpha);
  }

  vline(x: number, y: number, h: number, color: string, alpha = 1): void {
    this.rect(x, y, 1, h, color, alpha);
  }

  /** Chunky Bresenham line, 1 or 2 px thick. */
  line(x0: number, y0: number, x1: number, y1: number, color: string, thick = 1, alpha = 1): void {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const dx = Math.abs(Math.round(x1) - x);
    const dy = Math.abs(Math.round(y1) - y);
    const sx = x < x1 ? 1 : -1;
    const sy = y < y1 ? 1 : -1;
    let err = dx - dy;
    for (let guard = 0; guard < 4000; guard += 1) {
      this.rect(x, y, thick, thick, color, alpha);
      if (x === Math.round(x1) && y === Math.round(y1)) break;
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  circle(cx: number, cy: number, r: number, color: string, alpha = 1): void {
    const r2 = r * r;
    for (let y = -r; y <= r; y += 1) {
      for (let x = -r; x <= r; x += 1) {
        if (x * x + y * y <= r2) this.px(cx + x, cy + y, color, alpha);
      }
    }
  }

  ring(cx: number, cy: number, r: number, color: string, alpha = 1, thickness = 1): void {
    const outer = r * r;
    const inner = (r - thickness) * (r - thickness);
    for (let y = -r; y <= r; y += 1) {
      for (let x = -r; x <= r; x += 1) {
        const d = x * x + y * y;
        if (d <= outer && d > inner) this.px(cx + x, cy + y, color, alpha);
      }
    }
  }

  /** Soft light pool; the scene adds these with an additive blend. */
  glow(cx: number, cy: number, r: number, color: string, alpha: number): void {
    if (r <= 0) return;
    const gradient = this.ctx.createRadialGradient(
      Math.round(this.ox + cx),
      Math.round(this.oy + cy),
      0,
      Math.round(this.ox + cx),
      Math.round(this.oy + cy),
      r,
    );
    gradient.addColorStop(0, hexWithAlpha(color, alpha));
    gradient.addColorStop(0.55, hexWithAlpha(color, alpha * 0.35));
    gradient.addColorStop(1, hexWithAlpha(color, 0));
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.ox + cx - r, this.oy + cy - r, r * 2, r * 2);
  }

  /** Random speckle used for wear, dust and rust. */
  speckle(x: number, y: number, w: number, h: number, color: string, count: number, seed: number, alpha = 0.35): void {
    for (let i = 0; i < count; i += 1) {
      const nx = x + Math.floor(hash(i, 1, seed) * w);
      const ny = y + Math.floor(hash(i, 2, seed) * h);
      this.px(nx, ny, color, alpha * (0.4 + hash(i, 3, seed) * 0.6));
    }
  }

  pipeV(x: number, y: number, h: number, w: number, color: string, light: string, dark: string): void {
    this.rect(x, y, w, h, color);
    this.vline(x, y, h, light);
    this.vline(x + w - 1, y, h, dark);
    for (let yy = y + 8; yy < y + h; yy += 26) this.rect(x - 1, yy, w + 2, 2, dark, 0.85);
  }

  pipeH(y: number, x: number, w: number, h: number, color: string, light: string, dark: string): void {
    this.rect(x, y, w, h, color);
    this.hline(x, y, w, light);
    this.hline(x, y + h - 1, w, dark);
    for (let xx = x + 10; xx < x + w; xx += 32) this.rect(xx, y - 1, 2, h + 2, dark, 0.8);
  }

  /** Monitor with scanlines and a fake readout. */
  screen(x: number, y: number, w: number, h: number, tint: string, seed: number): void {
    this.bevel(x, y, w, h, '#04151c', C.steel, C.ink);
    this.rect(x + 2, y + 2, w - 4, h - 4, '#082430');
    for (let yy = y + 3; yy < y + h - 3; yy += 2) this.hline(x + 2, yy, w - 4, '#0b3a4a', 0.6);
    const bars = 3;
    for (let i = 0; i < bars; i += 1) {
      const bw = Math.max(3, Math.round((w - 8) * (0.3 + hash(i, 1, seed) * 0.6)));
      this.rect(x + 4, y + 4 + i * 3, bw, 1, i === 0 ? tint : i === 1 ? C.cyan : C.amber, 0.85);
    }
  }

  grate(x: number, y: number, w: number, h: number, base: string, light: string): void {
    this.rect(x, y, w, h, base);
    for (let xx = x + 2; xx < x + w - 1; xx += 4) this.vline(xx, y, h, light, 0.55);
    this.hline(x, y, w, light, 0.7);
  }
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Warm/cool light pooling on a wall, drawn straight into the room texture. */
export function wallLight(b: Brush, x: number, y: number, w: number, h: number, color: string, strength = 0.14): void {
  const g = b.ctx.createLinearGradient(0, b.oy + y, 0, b.oy + y + h);
  g.addColorStop(0, hexWithAlpha(color, strength));
  g.addColorStop(0.55, hexWithAlpha(color, strength * 0.35));
  g.addColorStop(1, hexWithAlpha(color, 0));
  b.ctx.fillStyle = g;
  b.ctx.fillRect(b.ox + x, b.oy + y, w, h);
}
