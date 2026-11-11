import { hash, surface } from '../art/painter';
import type { DiveTheme } from './scenery';

export type ZoneKind = 'heat' | 'current' | 'debris' | 'signal';

export interface HazardZone {
  kind: ZoneKind;
  x: number;
  y: number;
  r: number;
  label: string;
}

const LABELS: Record<ZoneKind, string> = {
  heat: 'جریان گرم — بدنه در حال گرم شدن',
  current: 'جریان رو به بالا — کنترل سخت شده',
  debris: 'آوار معلق — مسیر پرخطر',
  signal: 'تداخل سیگنال — داده در حال ثبت',
};

/** Two to four named hazards per biome, positioned once per map bake. */
export function hazardsFor(theme: DiveTheme, width: number, height: number): HazardZone[] {
  const seed = Math.round(theme.depthM / 100);
  const floorY = height - 120;
  const pick = (i: number, salt: number) => hash(i, salt, seed);

  const layout: Record<DiveTheme['id'], Array<[ZoneKind, number]>> = {
    canyon: [['current', 0], ['debris', 1], ['current', 2]],
    vents: [['heat', 0], ['heat', 1], ['heat', 2], ['signal', 3]],
    wreck: [['debris', 0], ['debris', 1], ['current', 2]],
    plain: [['current', 0], ['debris', 1]],
    signal: [['signal', 0], ['signal', 1], ['heat', 2], ['current', 3]],
  };

  return layout[theme.id].map(([kind, i]) => ({
    kind,
    x: 90 + pick(i, 21) * (width - 180),
    y: 260 + pick(i, 22) * (floorY - 420),
    r: kind === 'signal' ? 130 : 110,
    label: LABELS[kind],
  }));
}

/** Soft coloured glow drawn into the baked map so zones are visible, not magic. */
export function paintHazardGlow(kind: ZoneKind): string {
  switch (kind) {
    case 'heat':
      return 'rgba(255, 138, 64, ALPHA)';
    case 'current':
      return 'rgba(120, 210, 235, ALPHA)';
    case 'debris':
      return 'rgba(150, 140, 120, ALPHA)';
    default:
      return 'rgba(168, 120, 255, ALPHA)';
  }
}

/** Small marine organism sprites: three silhouettes at different depths. */
export function paintCreature(kind: number, seed = 1): HTMLCanvasElement {
  const { canvas, ctx } = surface(22, 14);
  const hue = kind === 0 ? '#9fe6f2' : kind === 1 ? '#ffb8a0' : '#c9a0ff';
  ctx.globalAlpha = 0.9;
  if (kind === 0) {
    // small fish
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.ellipse(11, 7, 7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(17, 7);
    ctx.lineTo(22, 3.5);
    ctx.lineTo(22, 10.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#06202a';
    ctx.beginPath();
    ctx.arc(8, 6.4, 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 1) {
    // crustacean on the floor
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.ellipse(11, 8, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hue;
    ctx.lineWidth = 1;
    for (const dx of [-6, 6]) {
      ctx.beginPath();
      ctx.moveTo(11 + dx, 8);
      ctx.lineTo(11 + dx * 1.7, 5.5);
      ctx.stroke();
    }
  } else {
    // jellyfish with faint glow
    const g = ctx.createRadialGradient(11, 7, 0, 11, 7, 11);
    g.addColorStop(0, 'rgba(201, 160, 255, 0.5)');
    g.addColorStop(1, 'rgba(201, 160, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 22, 14);
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.ellipse(11, 6, 5, 3.4, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = hue;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(11 + i * 2, 7);
      ctx.quadraticCurveTo(11 + i * 2 + (hash(i, seed, 3) - 0.5) * 4, 10, 11 + i * 2, 13);
      ctx.stroke();
    }
  }
  return canvas;
}
