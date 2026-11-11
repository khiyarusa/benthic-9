import type { RoomId } from '../../sim/types';
import { Brush, C, hash, surface, wallLight } from './painter';

/**
 * Interior painters. One call per room per size; the result is uploaded as a
 * Phaser texture, so per-frame cost drops to a single blit per room.
 */

function decor(b: Brush, w: number, h: number, accent: string, seed: number): void {
  const floorTop = h - Math.max(10, Math.round(h * 0.16));

  // ceiling cable tray with hanging conduits
  b.hline(3, Math.round(h * 0.13), w - 6, C.ink, 0.5);
  for (let x = 6; x < w - 6; x += 13) {
    b.rect(x, Math.round(h * 0.13), 5, 1, C.steel, 0.5);
  }
  // wall conduit running vertically into the deck
  const cx = 4 + Math.round(hash(seed, 1, 3) * (w - 14));
  b.vline(cx, Math.round(h * 0.16), floorTop - Math.round(h * 0.16), C.steel, 0.55);
  b.vline(cx + 1, Math.round(h * 0.16), floorTop - Math.round(h * 0.16), C.ink, 0.3);
  for (let y = Math.round(h * 0.2); y < floorTop - 4; y += 14) {
    b.rect(cx - 1, y, 3, 1, C.steelLight, 0.5);
  }

  // fire extinguisher
  if (w > 90) {
    const fx = w - 10;
    b.rect(fx, floorTop - 10, 4, 10, '#8f2f28');
    b.rect(fx + 1, floorTop - 12, 2, 2, C.steel);
    b.px(fx + 2, floorTop - 7, '#ff9a90', 0.7);
  }

  // floor drain + lane marking
  const drainX = Math.round(w * 0.2 + hash(seed, 2, 5) * w * 0.5);
  b.rect(drainX, floorTop + Math.round((h - floorTop) / 2) - 1, 7, 2, C.ink, 0.6);
  b.rect(4, floorTop - 2, Math.round(w * 0.3), 1, accent, 0.18);

  // stencil number on the wall
  const nx = Math.round(w * 0.62 + hash(seed, 3, 7) * w * 0.2);
  const ny = Math.round(h * 0.2);
  b.rect(nx, ny, 10, 6, '#0a2632', 0.8);
  b.rect(nx + 2, ny + 2, 6, 1, accent, 0.5);
  b.rect(nx + 2, ny + 4, 3, 1, accent, 0.3);

  // warning placard
  b.rect(6, Math.round(h * 0.42), 9, 7, '#3a2a0c', 0.85);
  b.rect(7, Math.round(h * 0.42) + 2, 7, 1, C.amber, 0.7);
  b.rect(7, Math.round(h * 0.42) + 4, 5, 1, C.amber, 0.45);

  // small crate in a corner, breaks the symmetry
  if (w > 110) {
    const bx = 6;
    const by = floorTop - 8;
    b.bevel(bx, by, 10, 8, '#1b3d49', C.steelLight, C.ink);
    b.rect(bx + 1, by + 2, 8, 1, accent, 0.25);
  }
}

function shell(b: Brush, w: number, h: number, accent: string): void {
  const floorH = Math.max(10, Math.round(h * 0.16));
  const ceilH = Math.max(8, Math.round(h * 0.11));

  // wall
  b.rect(0, 0, w, h, C.hull);
  // vertical plates
  const plate = Math.max(22, Math.round(w / 6));
  for (let x = plate; x < w; x += plate) {
    b.vline(x, 0, h, C.frame, 0.35);
    b.vline(x + 1, 0, h, C.ink, 0.25);
  }
  // horizontal trim
  b.hline(0, Math.round(h * 0.58), w, C.frame, 0.32);
  b.hline(0, Math.round(h * 0.58) + 1, w, C.ink, 0.25);

  // ceiling
  b.rect(0, 0, w, ceilH, C.hullDark);
  b.hline(0, ceilH - 1, w, C.frame, 0.55);

  // floor
  b.rect(0, h - floorH, w, floorH, C.floor);
  b.grate(0, h - floorH, w, floorH, C.floor, C.floorLight);
  b.hline(0, h - floorH, w, '#061319');

  // contact shadow above the floor
  const grad = b.ctx.createLinearGradient(0, b.oy + h - floorH - 8, 0, b.oy + h - floorH);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  b.ctx.fillStyle = grad;
  b.ctx.fillRect(b.ox, b.oy + h - floorH - 8, w, 8);

  // corner ribs
  b.rect(0, 0, 3, h, C.steel);
  b.rect(w - 3, 0, 3, h, C.steel);
  b.vline(3, 0, h, C.steelLight, 0.4);

  // accent stripe unique per room
  b.rect(0, ceilH + 2, w, 2, accent, 0.55);

  // bolts
  for (let x = 6; x < w - 4; x += 18) {
    b.px(x, ceilH + 6, C.steelLight, 0.5);
    b.px(x, h - floorH - 5, C.steelLight, 0.4);
  }

  wallLight(b, 0, 0, w, Math.round(h * 0.8), C.warm, 0.1);
  decor(b, w, h, accent, Math.round(w + h));
}

function lamp(b: Brush, x: number, y: number, w: number): void {
  b.rect(x, y, w, 3, '#3b2a16');
  b.rect(x + 1, y + 1, w - 2, 2, C.warm);
  b.rect(x - 2, y + 3, w + 4, 1, C.warm, 0.22);
  b.glow(x + w / 2, y + 8, w * 0.9, C.warm, 0.16);
}

function cableRun(b: Brush, x: number, y: number, w: number, sag = 6): void {
  const steps = Math.max(2, Math.round(w / 12));
  let prevY = y;
  for (let i = 1; i <= steps; i += 1) {
    const nx = x + (w * i) / steps;
    const ny = y + Math.sin((i / steps) * Math.PI) * sag;
    b.line(x + (w * (i - 1)) / steps, prevY, nx, ny, C.ink, 1, 0.75);
    b.px(nx, ny, C.steelLight, 0.4);
    prevY = ny;
  }
}

function hazardStrip(b: Brush, x: number, y: number, w: number): void {
  for (let i = 0; i < w; i += 8) {
    b.rect(x + i, y, 4, 3, C.amber, 0.5);
  }
}

function locker(b: Brush, x: number, y: number, w: number, h: number, tint: string): void {
  b.bevel(x, y, w, h, '#123642', C.steelLight, C.ink);
  b.rect(x + 2, y + 2, w - 4, 3, tint, 0.5);
  b.vline(x + Math.round(w / 2), y + 2, h - 4, C.ink, 0.7);
  b.px(x + Math.round(w / 2) - 3, y + Math.round(h / 2), C.steelLight);
  b.px(x + Math.round(w / 2) + 3, y + Math.round(h / 2), C.steelLight);
}

function consoleUnit(b: Brush, x: number, y: number, w: number, h: number, seed: number): void {
  b.bevel(x, y, w, h, '#0b2733', C.steelLight, C.ink);
  b.rect(x + 2, y - 3, w - 4, 3, C.steel);
  b.screen(x + 4, y + 3, Math.max(10, w - 8), Math.max(8, h - 10), C.cyan, seed);
}

function chair(b: Brush, x: number, y: number, color = '#1b4a58'): void {
  b.rect(x, y, 7, 4, color);
  b.rect(x + 1, y - 6, 5, 7, color);
  b.px(x + 3, y + 4, C.ink);
  b.rect(x + 1, y + 6, 5, 1, C.ink, 0.8);
}

function plantBubbles(b: Brush, x: number, y: number, w: number, h: number, seed: number, color: string): void {
  for (let i = 0; i < 9; i += 1) {
    const bx = x + Math.floor(hash(i, 1, seed) * w);
    const by = y + Math.floor(hash(i, 2, seed) * h);
    b.px(bx, by, color, 0.5);
    b.px(bx, by - 2, color, 0.25);
  }
}

// ---------------------------------------------------------------- command deck

function command(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.cyan);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));
  const deckY = Math.round(h * 0.46);

  // elevated command deck
  b.rect(0, deckY, w, floorTop - deckY, C.floor, 0.55);
  b.hline(0, deckY, w, C.frameLight, 0.4);

  // main viewport looking into the abyss
  const vw = Math.round(w * 0.52);
  const vx = Math.round((w - vw) / 2);
  const vy = Math.round(h * 0.14);
  const vh = Math.round(h * 0.3);
  b.bevel(vx - 2, vy - 2, vw + 4, vh + 4, C.frame, C.steelLight, C.ink);
  b.rect(vx, vy, vw, vh, '#04141d');
  const grad = b.ctx.createLinearGradient(0, b.oy + vy, 0, b.oy + vy + vh);
  grad.addColorStop(0, '#0a3346');
  grad.addColorStop(0.55, '#051c28');
  grad.addColorStop(1, '#020c12');
  b.ctx.fillStyle = grad;
  b.ctx.fillRect(b.ox + vx, b.oy + vy, vw, vh);
  // distant fish
  for (let i = 0; i < 3; i += 1) {
    const fx = vx + 6 + Math.round(hash(i, 4, 9) * (vw - 16));
    const fy = vy + 5 + Math.round(hash(i, 5, 9) * (vh - 12));
    b.rect(fx, fy, 3, 1, '#2e6a7d', 0.7);
    b.px(fx - 1, fy, '#2e6a7d', 0.5);
  }
  // glass reflection
  b.line(vx + 3, vy + vh - 4, vx + vw * 0.4, vy + 2, C.glass, 1, 0.1);
  b.line(vx + 8, vy + vh - 4, vx + vw * 0.5, vy + 2, C.glass, 1, 0.06);
  b.frame(vx, vy, vw, vh, C.frameLight, 0.55);

  // status board (left wall)
  const bx = 4;
  const by = Math.round(h * 0.16);
  b.bevel(bx, by, 26, Math.round(h * 0.24), '#071c26', C.steel, C.ink);
  b.rect(bx + 3, by + 3, 20, 2, C.green, 0.7);
  b.rect(bx + 3, by + 7, 14, 2, C.amber, 0.6);
  b.rect(bx + 3, by + 11, 18, 2, C.cyan, 0.5);
  b.rect(bx + 3, by + 15, 9, 2, C.red, 0.5);

  // console bank along the deck
  const consoleW = Math.max(20, Math.round(w * 0.15));
  const consoleH = Math.max(16, Math.round(h * 0.2));
  for (let i = 0; i < 3; i += 1) {
    const cx = Math.round(w * 0.14 + i * (consoleW + 6));
    if (cx + consoleW > w - 8) break;
    consoleUnit(b, cx, deckY - consoleH, consoleW, consoleH, i + 3);
    chair(b, cx + Math.round(consoleW / 2) - 3, deckY + 2);
  }

  // helm wheel
  b.ring(8, deckY - 8, 5, C.amber, 0.75);
  b.px(8, deckY - 8, C.amber, 0.9);
  // coffee cup, because stations run on it
  b.rect(w - 12, floorTop - 5, 4, 3, C.white, 0.55);
  lamp(b, Math.round(w * 0.3), 6, Math.round(w * 0.18));
  lamp(b, Math.round(w * 0.62), 6, Math.round(w * 0.18));
  cableRun(b, 0, 9, w, 5);
}

// --------------------------------------------------------------------- reactor

function reactor(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.amber);
  const cy = Math.round(h * 0.5);
  const cx = Math.round(w * 0.5);
  const r = Math.max(9, Math.round(Math.min(w, h) * 0.24));

  // shielding block behind the core
  b.rect(cx - r - 8, cy - r - 6, (r + 8) * 2, (r + 6) * 2, C.hullDark, 0.8);
  b.rect(cx - r - 8, cy - r - 6, (r + 8) * 2, 3, C.steel, 0.8);

  // core housing
  b.circle(cx, cy, r + 3, C.steel);
  b.ring(cx, cy, r + 2, C.frameLight, 0.85);
  b.circle(cx, cy, r, '#2a1c0a');
  b.ring(cx, cy, r, C.amber, 0.85);
  b.ring(cx, cy, Math.round(r * 0.72), C.amberDim, 0.9);
  b.circle(cx, cy, Math.round(r * 0.5), '#6b3f12');
  b.circle(cx, cy, Math.round(r * 0.34), C.amber, 0.75);
  b.circle(cx, cy - 1, Math.round(r * 0.2), '#ffe6b5', 0.85);
  b.glow(cx, cy, r * 2.1, C.amber, 0.22);

  // cooling pipes to the walls
  b.pipeH(cy - Math.round(r * 0.55), 3, cx - r - 6, 5, C.steel, C.steelLight, C.ink);
  b.pipeH(cy + Math.round(r * 0.55), 3, cx - r - 6, 5, C.steel, C.steelLight, C.ink);
  b.pipeH(cy - Math.round(r * 0.55), cx + r + 3, w - (cx + r) - 5, 5, C.steel, C.steelLight, C.ink);
  b.pipeH(cy + Math.round(r * 0.55), cx + r + 3, w - (cx + r) - 5, 5, C.steel, C.steelLight, C.ink);

  // turbine on the right
  const tw = Math.max(10, Math.round(w * 0.14));
  b.bevel(w - tw - 4, Math.round(h * 0.22), tw, Math.round(h * 0.3), '#143a47', C.steelLight, C.ink);
  for (let i = 0; i < 4; i += 1) {
    b.hline(w - tw - 1, Math.round(h * 0.25) + i * 5, tw - 6, C.steelLight, 0.5);
  }
  b.rect(w - tw - 1, Math.round(h * 0.55), tw - 6, 2, C.amber, 0.6);

  // gauges on the left
  b.bevel(3, Math.round(h * 0.2), 16, Math.round(h * 0.22), '#071c26', C.steel, C.ink);
  b.circle(11, Math.round(h * 0.26), 3, C.amber, 0.8);
  b.circle(11, Math.round(h * 0.33), 3, C.red, 0.5);

  hazardStrip(b, 3, h - Math.max(10, Math.round(h * 0.16)) - 6, Math.round(w * 0.4));
  lamp(b, Math.round(w * 0.16), 6, Math.round(w * 0.12));
}

// ---------------------------------------------------------------- life support

function life(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.green);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));
  const tankH = Math.round(h * 0.56);
  const tankW = Math.max(9, Math.round(w * 0.13));

  // twin oxygen tanks
  for (let i = 0; i < 2; i += 1) {
    const tx = 6 + i * (tankW + 6);
    const ty = floorTop - tankH;
    b.bevel(tx, ty, tankW, tankH, '#0b2c38', C.steelLight, C.ink);
    b.rect(tx + 2, ty + 8, tankW - 4, Math.round(tankH * 0.5), C.cyanDim, 0.55);
    b.rect(tx + 2, ty + 8, tankW - 4, 1, C.cyan, 0.7);
    b.rect(tx + 2, ty + 8 + Math.round(tankH * 0.5), tankW - 4, 2, C.cyan, 0.35);
    b.rect(tx + Math.round(tankW / 2) - 1, ty - 3, 3, 4, C.steel);
    // pressure banding
    for (let yy = ty + 12; yy < ty + tankH - 4; yy += 12) b.hline(tx + 2, yy, tankW - 4, C.ink, 0.35);
    b.rect(tx + 2, ty + 4, tankW - 4, 2, C.green, 0.4);
  }

  // scrubber cabinet with load LEDs
  const sx = Math.round(w * 0.34);
  const sw = Math.max(12, Math.round(w * 0.18));
  b.bevel(sx, floorTop - Math.round(h * 0.4), sw, Math.round(h * 0.4), '#123642', C.steelLight, C.ink);
  for (let i = 0; i < 4; i += 1) {
    b.rect(sx + 3, floorTop - Math.round(h * 0.36) + i * 5, sw - 6, 2, i < 3 ? C.green : C.ink, 0.7);
  }

  // electrolysis stack + bubbling water column
  const ex = Math.round(w * 0.58);
  const ew = Math.max(12, Math.round(w * 0.16));
  b.bevel(ex, floorTop - Math.round(h * 0.46), ew, Math.round(h * 0.46), '#0a2531', C.steelLight, C.ink);
  b.rect(ex + 3, floorTop - Math.round(h * 0.4), ew - 6, Math.round(h * 0.22), C.water, 0.9);
  plantBubbles(b, ex + 3, floorTop - Math.round(h * 0.4), ew - 6, Math.round(h * 0.22), 7, C.glass);

  // oxygen line across the ceiling
  b.pipeH(6, 0, w, 4, C.steel, C.steelLight, C.ink);
  b.rect(Math.round(w * 0.4), 10, 2, Math.round(h * 0.1), C.steel, 0.8);
  b.rect(Math.round(w * 0.4), Math.round(h * 0.1) + 8, 6, 3, C.green, 0.5);

  b.bevel(w - 14, Math.round(h * 0.22), 11, 12, '#071c26', C.steel, C.ink);
  b.rect(w - 12, Math.round(h * 0.24), 7, 2, C.green, 0.8);
  lamp(b, Math.round(w * 0.2), 6, Math.round(w * 0.14));
}

// ---------------------------------------------------------------------- biolab

function biolab(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.green);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));

  // bench with instruments
  const benchY = floorTop - Math.round(h * 0.22);
  b.bevel(4, benchY, Math.round(w * 0.52), 4, C.steel, C.steelLight, C.ink);
  b.rect(6, benchY + 4, Math.round(w * 0.52) - 4, Math.round(h * 0.12), '#0d2f3b');
  b.hline(6, benchY + 4, Math.round(w * 0.52) - 4, C.ink);

  // microscopes / sample trays
  for (let i = 0; i < 3; i += 1) {
    const mx = 9 + i * 17;
    b.rect(mx, benchY - 7, 5, 7, '#1d4a58');
    b.px(mx + 2, benchY - 8, C.cyan, 0.9);
    b.rect(mx - 1, benchY - 3, 7, 2, C.steel);
  }
  b.rect(60, benchY - 5, 6, 5, C.water, 0.9);
  b.px(62, benchY - 4, C.green, 0.9);

  // specimen tubes on the right
  const tx = Math.round(w * 0.66);
  const th = Math.round(h * 0.34);
  for (let i = 0; i < 3; i += 1) {
    const xx = tx + i * 9;
    b.bevel(xx, floorTop - th, 6, th, '#062430', C.glass, C.ink);
    b.rect(xx + 1, floorTop - th + 5, 4, th - 9, C.greenDim, 0.6);
    b.rect(xx + 1, floorTop - th + 5, 4, 1, C.green, 0.8);
    b.rect(xx + 2, floorTop - th + 12, 1, 3, C.green, 0.5);
    b.rect(xx, floorTop - th - 2, 6, 2, C.steelLight);
  }

  // large culture tank
  const gx = Math.round(w * 0.82);
  if (gx + 12 < w) {
    b.bevel(gx, Math.round(h * 0.3), 12, Math.round(h * 0.3), '#041a22', C.frameLight, C.ink);
    b.rect(gx + 1, Math.round(h * 0.32), 10, Math.round(h * 0.26), C.greenDim, 0.45);
    b.px(gx + 5, Math.round(h * 0.42), C.green, 0.9);
    b.px(gx + 7, Math.round(h * 0.46), C.green, 0.7);
    b.px(gx + 3, Math.round(h * 0.5), C.green, 0.6);
  }

  // sample jars shelf
  b.hline(4, Math.round(h * 0.2), Math.round(w * 0.3), C.steel, 0.9);
  for (let i = 0; i < 4; i += 1) {
    const jx = 6 + i * 11;
    b.rect(jx, Math.round(h * 0.2) - 5, 4, 5, '#1c4c5b', 0.9);
    b.px(jx + 1, Math.round(h * 0.2) - 3, C.amber, 0.7);
  }

  lamp(b, Math.round(w * 0.34), 6, Math.round(w * 0.16));
  cableRun(b, 0, 10, w, 4);
}

// --------------------------------------------------------------------- geolab

function geolab(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.amber);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));

  // rock core samples on a rack
  const rackY = floorTop - Math.round(h * 0.2);
  b.hline(4, rackY, Math.round(w * 0.42), C.steel, 0.9);
  for (let i = 0; i < 5; i += 1) {
    const rx = 6 + i * 12;
    const rh = 6 + (i % 3) * 4;
    b.rect(rx, rackY - rh, 8, rh, i % 2 ? '#3a5b68' : '#2b4753');
    b.rect(rx, rackY - rh, 8, 1, C.steelLight, 0.6);
    b.px(rx + 2, rackY - rh + 3, C.amber, 0.5);
  }

  // core drill rig
  const dx = Math.round(w * 0.52);
  const dw = Math.max(14, Math.round(w * 0.2));
  b.bevel(dx, Math.round(h * 0.24), dw, Math.round(h * 0.12), '#143a47', C.steelLight, C.ink);
  b.rect(dx + Math.round(dw / 2) - 1, Math.round(h * 0.36), 3, Math.round(h * 0.34), C.steel);
  for (let i = 0; i < 7; i += 1) {
    b.rect(dx + Math.round(dw / 2) - 2, Math.round(h * 0.36) + i * 5, 5, 2, C.steelLight, 0.65);
  }
  b.rect(dx - 2, Math.round(h * 0.7), dw + 4, 3, C.ink);
  b.rect(dx + Math.round(dw / 2) - 3, Math.round(h * 0.7) - 4, 7, 3, C.amber, 0.8);

  // analysis bench
  b.bevel(Math.round(w * 0.78), floorTop - Math.round(h * 0.26), Math.round(w * 0.18), 4, C.steel, C.steelLight, C.ink);
  b.screen(Math.round(w * 0.8), floorTop - Math.round(h * 0.36), Math.round(w * 0.14), Math.round(h * 0.1), C.amber, 5);

  // seismograph wall panel
  b.bevel(3, Math.round(h * 0.2), 22, 12, '#071c26', C.steel, C.ink);
  for (let i = 0; i < 18; i += 1) {
    const y = Math.round(h * 0.26) + Math.round(Math.sin(i * 1.7) * 2);
    b.px(5 + i, y, C.green, 0.75);
  }
  lamp(b, Math.round(w * 0.24), 6, Math.round(w * 0.14));
}

// ---------------------------------------------------------------------- medbay

function medbay(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.red);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));

  // two beds
  for (let i = 0; i < 2; i += 1) {
    const bx = 5 + i * Math.round(w * 0.36);
    const by = floorTop - Math.round(h * 0.16);
    b.bevel(bx, by, Math.round(w * 0.3), 4, C.steel, C.steelLight, C.ink);
    b.rect(bx + 1, by - 3, Math.round(w * 0.28), 3, '#cfe4e8', 0.9);
    b.rect(bx + 1, by - 3, Math.round(w * 0.1), 3, '#a9c6cc', 0.9);
    b.rect(bx, by + 4, 2, 5, C.steel);
    b.rect(bx + Math.round(w * 0.3) - 2, by + 4, 2, 5, C.steel);
    // monitor above the bed
    b.bevel(bx + Math.round(w * 0.24), by - Math.round(h * 0.24), 12, 8, '#071c26', C.steel, C.ink);
    b.rect(bx + Math.round(w * 0.24) + 2, by - Math.round(h * 0.24) + 3, 8, 1, C.green, 0.85);
  }

  // red cross sign
  const mx = Math.round(w * 0.86);
  const my = Math.round(h * 0.26);
  b.rect(mx - 2, my - 6, 4, 12, C.red, 0.85);
  b.rect(mx - 6, my - 2, 12, 4, C.red, 0.85);
  b.rect(mx - 1, my - 5, 2, 10, '#ff9a90', 0.6);

  // medicine cabinet
  b.bevel(Math.round(w * 0.62), Math.round(h * 0.3), Math.round(w * 0.14), Math.round(h * 0.28), '#123642', C.steelLight, C.ink);
  for (let i = 0; i < 3; i += 1) {
    b.hline(Math.round(w * 0.63), Math.round(h * 0.36) + i * 6, Math.round(w * 0.12), C.steel, 0.5);
    b.px(Math.round(w * 0.64), Math.round(h * 0.35) + i * 6, i === 1 ? C.red : C.green, 0.7);
  }

  // IV stand
  b.vline(Math.round(w * 0.48), floorTop - Math.round(h * 0.3), Math.round(h * 0.3), C.steelLight, 0.8);
  b.rect(Math.round(w * 0.48) - 2, floorTop - Math.round(h * 0.3), 5, 3, '#cfe4e8', 0.8);
  b.rect(Math.round(w * 0.48) - 3, floorTop - 2, 7, 1, C.ink);

  lamp(b, Math.round(w * 0.3), 6, Math.round(w * 0.14));
  lamp(b, Math.round(w * 0.62), 6, Math.round(w * 0.14));
}

// -------------------------------------------------------------------- quarters

function quarters(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.cyanDim);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));

  // bunk beds, two tiers on the left
  const bunkW = Math.round(w * 0.34);
  for (let i = 0; i < 2; i += 1) {
    const by = Math.round(h * 0.3) + i * Math.round(h * 0.2);
    b.bevel(5, by, bunkW, 4, C.steel, C.steelLight, C.ink);
    b.rect(6, by - 3, bunkW - 2, 3, '#b9d3d8', 0.85);
    b.rect(6, by - 3, Math.round(bunkW * 0.3), 3, '#8fb2ba', 0.9);
    b.vline(5, by, Math.round(h * 0.2), C.steel, 0.7);
    b.vline(5 + bunkW, by, Math.round(h * 0.2), C.steel, 0.7);
  }
  b.rect(5, Math.round(h * 0.26), 2, floorTop - Math.round(h * 0.26), C.steel);

  // personal lockers
  for (let i = 0; i < 3; i += 1) {
    locker(b, Math.round(w * 0.45) + i * 12, floorTop - Math.round(h * 0.2), 10, Math.round(h * 0.2), C.cyanDim);
  }

  // table + lamp + mugs
  const tx = Math.round(w * 0.45);
  b.rect(tx, floorTop - Math.round(h * 0.1), Math.round(w * 0.24), 3, '#3d5c68');
  b.rect(tx + 3, floorTop - Math.round(h * 0.1) + 3, 2, Math.round(h * 0.08), C.steel);
  b.rect(tx + Math.round(w * 0.2), floorTop - Math.round(h * 0.1) + 3, 2, Math.round(h * 0.08), C.steel);
  b.rect(tx + 4, floorTop - Math.round(h * 0.12), 3, 2, C.white, 0.7);
  b.px(tx + 9, floorTop - Math.round(h * 0.12), C.amber, 0.8);

  // family photos / notes on the wall
  for (let i = 0; i < 3; i += 1) {
    b.rect(Math.round(w * 0.74) + i * 9, Math.round(h * 0.26), 7, 6, i % 2 ? '#2f6d7a' : '#7a5a3a', 0.8);
    b.rect(Math.round(w * 0.74) + i * 9 + 1, Math.round(h * 0.26) + 1, 5, 4, C.ink, 0.5);
  }

  lamp(b, Math.round(w * 0.48), 6, Math.round(w * 0.1));
}

// --------------------------------------------------------------------- storage

function storage(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.steelLight);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));

  // shelving unit
  const shelfW = Math.round(w * 0.56);
  b.rect(4, Math.round(h * 0.22), 2, floorTop - Math.round(h * 0.22), C.steel);
  b.rect(4 + shelfW, Math.round(h * 0.22), 2, floorTop - Math.round(h * 0.22), C.steel);
  for (let level = 0; level < 3; level += 1) {
    const sy = Math.round(h * 0.26) + level * Math.round(h * 0.2);
    b.hline(4, sy, shelfW, C.steel, 0.9);
    for (let i = 0; i < 5; i += 1) {
      const cw = 7 + (i % 2) * 3;
      const ch = 7 + (level % 2) * 3;
      const cx = 7 + i * 12;
      if (cx + cw > 4 + shelfW) break;
      b.bevel(cx, sy - ch, cw, ch, i % 2 ? '#254c58' : '#1b3d49', C.steelLight, C.ink);
      b.rect(cx + 1, sy - ch + 2, cw - 2, 2, C.amber, 0.35);
    }
  }

  // spare parts bins
  const binX = Math.round(w * 0.66);
  for (let i = 0; i < 2; i += 1) {
    b.bevel(binX, floorTop - Math.round(h * 0.2) + i * Math.round(h * 0.1), Math.round(w * 0.24), Math.round(h * 0.08), '#1a3f4b', C.steelLight, C.ink);
    b.rect(binX + 2, floorTop - Math.round(h * 0.18) + i * Math.round(h * 0.1), Math.round(w * 0.2), 2, C.steelLight, 0.4);
  }

  // cargo net
  for (let i = 0; i < 6; i += 1) {
    b.line(binX, Math.round(h * 0.26) + i * 4, binX + Math.round(w * 0.24), Math.round(h * 0.26) + i * 4 + 6, C.ink, 1, 0.35);
  }

  hazardStrip(b, 4, floorTop - 8, Math.round(w * 0.5));
  lamp(b, Math.round(w * 0.36), 6, Math.round(w * 0.12));
}

// -------------------------------------------------------------------- corridor

function corridor(b: Brush, w: number, h: number): void {
  const floorH = Math.max(9, Math.round(h * 0.2));
  b.rect(0, 0, w, h, '#0a2732');

  // ribbed pressure frames
  const ribs = Math.max(4, Math.round(w / 54));
  for (let i = 0; i <= ribs; i += 1) {
    const x = Math.round((w / ribs) * i) - 2;
    b.rect(x, 0, 4, h, C.steel);
    b.vline(x, 0, h, C.steelLight, 0.5);
    b.vline(x + 3, 0, h, C.ink, 0.6);
  }

  // overhead cable tray and pipes
  b.rect(0, 3, w, 6, C.hullDark);
  b.pipeH(4, 2, w - 4, 3, C.steel, C.steelLight, C.ink);
  cableRun(b, 0, 10, w, 4);

  // floor grating with hazard edge
  b.rect(0, h - floorH, w, floorH, C.floor);
  b.grate(0, h - floorH, w, floorH, C.floor, C.floorLight);
  for (let i = 0; i < w; i += 16) b.rect(i, h - floorH, 8, 2, C.amber, 0.18);

  // access hatches
  for (let i = 1; i <= 2; i += 1) {
    const x = Math.round((w / 3) * i) - 6;
    b.bevel(x, Math.round(h * 0.26), 12, Math.round(h * 0.42), '#0b3140', C.frameLight, C.ink);
    b.circle(x + 6, Math.round(h * 0.47), 3, C.amber, 0.45);
    b.ring(x + 6, Math.round(h * 0.47), 4, C.steelLight, 0.6);
  }

  // wall lamps, alternating
  for (let i = 0; i < 3; i += 1) {
    const lx = Math.round(w * (0.12 + i * 0.32));
    b.rect(lx, Math.round(h * 0.16), 8, 2, C.warm, 0.85);
    b.glow(lx + 4, Math.round(h * 0.18), 14, C.warm, 0.14);
  }
}

// -------------------------------------------------------------------- ROV bay

function rov(b: Brush, w: number, h: number): void {
  shell(b, w, h, C.cyan);
  const floorTop = h - Math.max(10, Math.round(h * 0.16));

  // launch pool: a dark hatch in the floor with water
  const poolW = Math.round(w * 0.58);
  const poolX = Math.round((w - poolW) / 2);
  const poolY = floorTop - Math.round(h * 0.1);
  b.rect(poolX - 2, poolY - 2, poolW + 4, Math.round(h * 0.2) + 4, C.steel);
  b.rect(poolX, poolY, poolW, Math.round(h * 0.16), '#03141c');
  b.rect(poolX, poolY, poolW, Math.round(h * 0.16), C.water, 0.65);
  for (let i = 0; i < 10; i += 1) {
    const wx = poolX + Math.round(hash(i, 1, 3) * poolW);
    b.px(wx, poolY + 2 + Math.round(hash(i, 2, 3) * (h * 0.12)), C.glass, 0.35);
  }
  b.hline(poolX, poolY, poolW, C.cyan, 0.35);

  // gantry crane over the pool
  b.pipeH(Math.round(h * 0.18), 3, w - 6, 4, C.steel, C.steelLight, C.ink);
  b.vline(w - 8, Math.round(h * 0.2), Math.round(h * 0.22), C.steel);
  b.rect(Math.round(w * 0.34), Math.round(h * 0.18) + 4, 3, Math.round(h * 0.16), C.steel);
  b.rect(Math.round(w * 0.34) - 3, Math.round(h * 0.34), 9, 4, C.amberDim);
  b.px(Math.round(w * 0.34) + 1, Math.round(h * 0.36), C.amber, 0.9);

  // ROV docked above the pool
  const rx = Math.round(w * 0.36);
  const ry = Math.round(h * 0.4);
  b.rect(rx, ry, 22, 11, C.amber, 0.9);
  b.rect(rx, ry, 22, 2, '#ffd79a');
  b.rect(rx + 2, ry + 3, 6, 5, '#1b3d49');
  b.rect(rx + 14, ry + 3, 6, 5, '#1b3d49');
  b.rect(rx + 2, ry + 11, 4, 3, C.steel);
  b.rect(rx + 16, ry + 11, 4, 3, C.steel);
  b.ring(rx + 11, ry + 6, 3, C.cyanDim, 0.9);

  // tether reel on the right wall
  b.ring(w - 12, Math.round(h * 0.42), 6, C.steelLight, 0.85);
  b.ring(w - 12, Math.round(h * 0.42), 4, C.ink, 0.6);
  b.line(w - 18, Math.round(h * 0.42), rx + 22, ry + 6, C.amberDim, 1, 0.8);

  // control station
  b.bevel(4, Math.round(h * 0.3), 16, Math.round(h * 0.14), '#0b2733', C.steelLight, C.ink);
  b.screen(6, Math.round(h * 0.32), 12, Math.round(h * 0.08), C.cyan, 11);

  // tool wall: wrenches, hoses and a spare thruster
  const toolY = Math.round(h * 0.24);
  b.hline(4, toolY + 10, Math.round(w * 0.26), C.steel, 0.8);
  for (let i = 0; i < 5; i += 1) {
    const tx2 = 6 + i * 9;
    b.rect(tx2, toolY, 2, 9, C.steelLight, 0.8);
    b.rect(tx2 - 1, toolY + 1, 4, 2, C.steel, 0.9);
  }
  // coiled umbilical hose
  b.ring(Math.round(w * 0.24), Math.round(h * 0.34), 6, C.amberDim, 0.75);
  b.ring(Math.round(w * 0.24), Math.round(h * 0.34), 4, C.amberDim, 0.55);
  // spare thruster on the deck
  b.bevel(Math.round(w * 0.62), floorTop - 9, 14, 8, '#123642', C.steelLight, C.ink);
  b.ring(Math.round(w * 0.62) + 15, floorTop - 5, 4, C.steelLight, 0.8);
  b.circle(Math.round(w * 0.62) + 15, floorTop - 5, 2, C.cyan, 0.4);
  // hanging chains from the crane
  for (let i = 0; i < 4; i += 1) {
    b.px(Math.round(w * 0.5) + i * 2, Math.round(h * 0.18) + 8 + i * 3, C.steelLight, 0.6);
  }
  // dive suit locker
  b.bevel(Math.round(w * 0.74), floorTop - Math.round(h * 0.22), Math.round(w * 0.16), Math.round(h * 0.22), '#0f3644', C.steelLight, C.ink);
  b.rect(Math.round(w * 0.76), floorTop - Math.round(h * 0.18), Math.round(w * 0.12), Math.round(h * 0.14), '#0a2029');
  b.px(Math.round(w * 0.82), floorTop - Math.round(h * 0.1), C.cyan, 0.5);

  lamp(b, Math.round(w * 0.2), 6, Math.round(w * 0.12));
  lamp(b, Math.round(w * 0.66), 6, Math.round(w * 0.12));
}

const PAINTERS: Record<RoomId, (b: Brush, w: number, h: number) => void> = {
  command,
  reactor,
  life,
  biolab,
  geolab,
  medbay,
  quarters,
  storage,
  corridor,
  rov,
};

export function paintRoom(room: RoomId, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h);
  const brush = new Brush(ctx);
  PAINTERS[room](brush, w, h);
  // outer rim so rooms never read as bare rectangles
  brush.frame(0, 0, w, h, C.steel, 0.55);
  return canvas;
}
