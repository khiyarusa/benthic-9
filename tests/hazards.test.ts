import { describe, expect, it } from 'vitest';
import { hazardsFor } from '../src/game/dive/hazards';
import { DIVE_THEMES } from '../src/game/dive/scenery';

const W = 900;
const H = 1800;

describe('dive hazards', () => {
  it('places two to four named zones inside the map for every biome', () => {
    for (const theme of DIVE_THEMES) {
      const zones = hazardsFor(theme, W, H);
      expect(zones.length).toBeGreaterThanOrEqual(2);
      expect(zones.length).toBeLessThanOrEqual(4);
      for (const zone of zones) {
        expect(zone.x).toBeGreaterThan(0);
        expect(zone.x).toBeLessThan(W);
        expect(zone.y).toBeGreaterThan(0);
        expect(zone.y).toBeLessThan(H);
        expect(zone.r).toBeGreaterThan(40);
        expect(zone.label.length).toBeGreaterThan(6);
      }
    }
  });

  it('gives the hydrothermal field heat zones and the signal region interference', () => {
    const vents = hazardsFor(DIVE_THEMES.find((t) => t.id === 'vents')!, W, H);
    expect(vents.some((z) => z.kind === 'heat')).toBe(true);
    const signal = hazardsFor(DIVE_THEMES.find((t) => t.id === 'signal')!, W, H);
    expect(signal.some((z) => z.kind === 'signal')).toBe(true);
  });

  it('is deterministic for the same biome and size', () => {
    const theme = DIVE_THEMES[0]!;
    expect(hazardsFor(theme, W, H)).toEqual(hazardsFor(theme, W, H));
  });
});
