import { Brush, C, surface } from './painter';

export interface CrewLook {
  accent: string;
  skin: string;
  hair: string;
  helmet: boolean;
  build: 'slim' | 'broad';
}

export const CREW_FRAME = { w: 16, h: 22, count: 6 };
export const CREW_FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3'] as const;

/**
 * Six-frame walk cycle painted from primitives with a real silhouette: helmet,
 * visor, backpack, accent suit stripe, swinging arms and alternating legs.
 */
export function paintCrewSheet(look: CrewLook): HTMLCanvasElement {
  const { canvas, ctx } = surface(CREW_FRAME.w * CREW_FRAME.count, CREW_FRAME.h);
  const b = new Brush(ctx);
  const wide = look.build === 'broad';

  for (let f = 0; f < CREW_FRAME.count; f += 1) {
    const ox = f * CREW_FRAME.w;
    const walking = f >= 2;
    const phase = walking ? (f - 2) % 4 : f;
    const bob = walking ? (phase % 2 === 0 ? 0 : -1) : f === 1 ? -1 : 0;
    const legPhase = phase;
    const armSwing = walking ? [1, 0, -1, 0][legPhase] ?? 0 : 0;

    const cx = ox + 8;
    const baseY = 21 + bob;

    // shadow
    b.rect(ox + 4, 20, 8, 1, '#000000', 0.35);

    // legs
    const leftLegY = baseY - 5;
    const rightLegY = baseY - 5;
    b.rect(cx - 3, leftLegY, 2, 5 - (legPhase === 1 ? 1 : 0), '#16323d');
    b.rect(cx + 1, rightLegY, 2, 5 - (legPhase === 3 ? 1 : 0), '#16323d');
    // boots
    b.rect(cx - 3, baseY - 1, 3, 1, '#0a1b22');
    b.rect(cx + 1, baseY - 1, 3, 1, '#0a1b22');
    if (walking) {
      const swing = [1, 0, -1, 0][legPhase] ?? 0;
      b.rect(cx - 3 + swing, baseY - 1, 3, 1, '#0a1b22');
    }

    // torso
    const torsoW = wide ? 8 : 7;
    const tx = cx - Math.floor(torsoW / 2);
    b.rect(tx, baseY - 12, torsoW, 7, look.accent);
    b.rect(tx, baseY - 12, torsoW, 1, '#ffffff', 0.2);
    b.rect(tx, baseY - 6, torsoW, 1, '#000000', 0.3);
    // belt
    b.rect(tx, baseY - 7, torsoW, 1, '#0d2029');
    // harness
    b.rect(tx + 1, baseY - 12, 1, 6, '#0d2029', 0.75);
    b.rect(tx + torsoW - 2, baseY - 12, 1, 6, '#0d2029', 0.75);

    // backpack
    b.rect(tx - 2, baseY - 12, 2, 5, '#123642');
    b.px(tx - 1, baseY - 11, C.cyan, 0.5);

    // arms
    b.rect(tx - 1, baseY - 11 - Math.max(0, armSwing), 1, 4, look.accent);
    b.rect(tx + torsoW, baseY - 11 + Math.min(0, armSwing), 1, 4, look.accent);

    // head
    const hy = baseY - 16;
    if (look.helmet) {
      b.rect(cx - 3, hy - 1, 6, 5, '#c9dbe1');
      b.rect(cx - 3, hy + 3, 6, 1, '#8ea8b1');
      b.rect(cx - 2, hy + 1, 4, 2, '#0b3542');
      b.rect(cx - 2, hy + 1, 2, 1, C.cyan, 0.5);
      b.rect(cx - 1, hy + 4, 2, 1, look.skin);
      // lamp
      b.px(cx + 2, hy, C.warm, 0.9);
    } else {
      b.rect(cx - 2, hy + 1, 5, 4, look.skin);
      b.rect(cx - 2, hy, 5, 2, look.hair);
      b.rect(cx - 3, hy + 2, 1, 2, look.hair);
      b.px(cx + 1, hy + 2, '#0a1b22');
      b.px(cx, hy + 3, '#8a5a44', 0.6);
    }
  }

  return canvas;
}
