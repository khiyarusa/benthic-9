import { Brush, C, hash, surface } from './painter';

/**
 * Main-menu hero: the station as a whole boat hanging in the abyss, with lit
 * windows, floodlights, sediment and distant geology. Painted once per resize.
 */
export function paintMenuScene(w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h);
  const b = new Brush(ctx);

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0a3043');
  g.addColorStop(0.35, '#061d2a');
  g.addColorStop(0.72, '#03121b');
  g.addColorStop(1, '#010609');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // light shafts
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i += 1) {
    const sx = w * (0.05 + i * 0.14);
    const spread = w * (0.05 + hash(i, 1, 5) * 0.06);
    const shaft = ctx.createLinearGradient(sx, 0, sx + spread, h * 0.9);
    shaft.addColorStop(0, 'rgba(120, 214, 233, 0.12)');
    shaft.addColorStop(0.45, 'rgba(90, 190, 214, 0.04)');
    shaft.addColorStop(1, 'rgba(60, 150, 180, 0)');
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(sx, -10);
    ctx.lineTo(sx + spread * 0.3, -10);
    ctx.lineTo(sx + spread, h);
    ctx.lineTo(sx + spread * 0.55, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // distant rock ridge
  const floor = h * 0.86;
  for (let x = 0; x < w; x += 7) {
    const bump = Math.sin(x * 0.009) * 8 + Math.sin(x * 0.031 + 2) * 4;
    b.rect(x, floor + bump, 7, h - floor, '#04141d');
  }
  for (let i = 0; i < 9; i += 1) {
    const rx = (w / 9) * i + hash(i, 2, 9) * 30;
    const rw = 40 + hash(i, 3, 9) * 90;
    const rh = 18 + hash(i, 4, 9) * 44;
    b.rect(rx, floor - rh * 0.4, rw, rh, '#061b25');
    b.rect(rx + 3, floor - rh * 0.4, rw - 6, 2, '#0b3140', 0.5);
  }

  // the vessel
  const cx = w * 0.52;
  const cy = h * 0.44;
  const hullW = Math.min(w * 0.62, 980);
  const hullH = Math.max(64, Math.min(h * 0.2, 150));

  // sediment cloud under the boat
  const cloud = ctx.createRadialGradient(cx, cy + hullH * 0.9, 8, cx, cy + hullH * 0.9, hullW * 0.5);
  cloud.addColorStop(0, 'rgba(60, 130, 150, 0.18)');
  cloud.addColorStop(1, 'rgba(60, 130, 150, 0)');
  ctx.fillStyle = cloud;
  ctx.fillRect(cx - hullW, cy, hullW * 2, hullH * 3);

  // hull body: cigar shape built from stacked rows
  const rows = Math.round(hullH);
  for (let i = 0; i < rows; i += 1) {
    const t = i / rows;
    const taper = Math.sin(Math.PI * t) ** 0.6;
    const rw = hullW * (0.5 + 0.5 * taper) * (1 - Math.abs(t - 0.5) * 0.55);
    const x = cx - rw / 2;
    const y = cy - hullH / 2 + i;
    const shade = t < 0.18 ? '#2a6b7d' : t < 0.5 ? '#173f4d' : '#0b2430';
    b.rect(x, y, rw, 1, shade);
  }
  // hull plating + rivets + rim light
  for (let i = 1; i < 8; i += 1) {
    const x = cx - hullW * 0.34 + i * (hullW * 0.085);
    b.vline(x, cy - hullH * 0.36, hullH * 0.72, '#05141b', 0.45);
    b.vline(x + 1, cy - hullH * 0.36, hullH * 0.72, '#1d4c5b', 0.35);
  }
  b.line(cx - hullW * 0.42, cy - hullH * 0.36, cx + hullW * 0.42, cy - hullH * 0.36, '#5fa9bd', 2, 0.55);
  for (let i = 0; i < 26; i += 1) {
    const rx = cx - hullW * 0.4 + i * (hullW * 0.032);
    b.px(rx, cy - hullH * 0.3, C.steelLight, 0.4);
    b.px(rx, cy + hullH * 0.28, C.steelLight, 0.3);
  }

  // lit windows along the hull
  for (let i = 0; i < 9; i += 1) {
    const wx = cx - hullW * 0.3 + i * (hullW * 0.072);
    const warm = i % 3 !== 2;
    b.rect(wx, cy - hullH * 0.12, 7, 4, warm ? '#ffd9a0' : '#7fd8e8', 0.85);
    b.rect(wx - 1, cy - hullH * 0.12 - 1, 9, 6, '#04141b', 0.0);
    b.glow(wx + 3, cy - hullH * 0.1, 14, warm ? C.warm : C.cyan, 0.12);
    // window frame
    b.frame(wx - 1, cy - hullH * 0.13, 9, 6, C.steel, 0.7);
  }

  // sail / conning tower
  const sailW = Math.max(34, hullW * 0.1);
  const sailH = Math.max(26, hullH * 0.62);
  const sailX = cx - sailW / 2 + hullW * 0.06;
  const sailY = cy - hullH * 0.36 - sailH;
  b.bevel(sailX, sailY, sailW, sailH + 6, '#123c4a', C.frameLight, C.ink);
  b.rect(sailX + 3, sailY + 5, sailW - 6, 6, '#061a22');
  b.rect(sailX + 4, sailY + 7, sailW - 8, 2, C.cyan, 0.5);
  // masts
  b.rect(sailX + sailW * 0.32, sailY - 16, 2, 16, C.steel);
  b.rect(sailX + sailW * 0.32 - 4, sailY - 17, 10, 2, C.steel);
  b.px(sailX + sailW * 0.32 - 2, sailY - 18, C.red, 0.85);
  b.rect(sailX + sailW * 0.62, sailY - 10, 1, 10, C.steelLight);
  b.px(sailX + sailW * 0.62, sailY - 11, C.amber, 0.8);

  // sonar dome + bow planes
  b.circle(cx - hullW * 0.44, cy, hullH * 0.28, '#0c2b36');
  b.ring(cx - hullW * 0.44, cy, hullH * 0.28, C.frameLight, 0.6);
  b.circle(cx - hullW * 0.44, cy, hullH * 0.12, '#17505f', 0.9);
  b.rect(cx - hullW * 0.3, cy - hullH * 0.1, hullW * 0.1, 3, '#1f5768', 0.8);
  b.rect(cx + hullW * 0.2, cy - hullH * 0.1, hullW * 0.1, 3, '#1f5768', 0.8);

  // stern thrusters
  for (let i = 0; i < 2; i += 1) {
    const tx = cx + hullW * 0.44;
    const ty = cy - hullH * 0.18 + i * hullH * 0.28;
    b.circle(tx, ty, hullH * 0.1, '#081c25');
    b.ring(tx, ty, hullH * 0.1, C.steelLight, 0.7);
    b.circle(tx + 2, ty, hullH * 0.05, '#2a7f95', 0.85);
    b.glow(tx + 4, ty, hullH * 0.3, C.cyan, 0.12);
  }

  // ROV bay door + crane rail on the underside
  const bayX = cx + hullW * 0.2;
  b.bevel(bayX, cy + hullH * 0.3, hullW * 0.12, hullH * 0.16, '#0a2530', C.frameLight, C.ink);
  for (let i = 0; i < 3; i += 1) {
    b.rect(bayX + 2, cy + hullH * 0.33 + i * 4, hullW * 0.12 - 4, 1, C.amber, 0.3);
  }

  // hull floodlights
  for (let i = 0; i < 4; i += 1) {
    const lx = cx - hullW * 0.24 + i * hullW * 0.16;
    b.rect(lx, cy + hullH * 0.2, 6, 3, C.steel);
    b.rect(lx + 1, cy + hullH * 0.21, 4, 1, C.warm, 0.9);
    const cone = ctx.createLinearGradient(lx + 3, cy + hullH * 0.24, lx + 3, cy + hullH * 0.9);
    cone.addColorStop(0, 'rgba(255, 226, 176, 0.16)');
    cone.addColorStop(1, 'rgba(255, 226, 176, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(lx + 3, cy + hullH * 0.24);
    ctx.lineTo(lx + 9, cy + hullH * 0.24);
    ctx.lineTo(lx + 34, cy + hullH * 1.0);
    ctx.lineTo(lx - 20, cy + hullH * 1.0);
    ctx.closePath();
    ctx.fill();
  }

  // marine snow
  for (let i = 0; i < 220; i += 1) {
    const px = hash(i, 1, 33) * w;
    const py = hash(i, 2, 33) * h;
    b.px(px, py, '#9fd8e6', 0.04 + hash(i, 3, 33) * 0.1);
  }

  // vignette
  const vg = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.2, w / 2, h * 0.5, Math.max(w, h) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,5,9,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}
