import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/sim/state';
import { applyDiveResult } from '../src/sim/dive';

const result = {
  themeId: 'vents' as const,
  depthM: 4200,
  samples: 5,
  data: 9,
  discoveries: ['clue-vents-0', 'clue-vents-1'],
  hullDamage: 12,
  batteryUsed: 34,
};

describe('manual dive results', () => {
  it('writes samples, data and discoveries into the real station state', () => {
    const state = createInitialState('campaign');
    const before = {
      samples: state.resources.samples,
      data: state.resources.data,
      expeditions: state.stats.expeditions,
      hull: state.rov.hull,
      battery: state.rov.batteryPct,
    };
    state.rov.deployed = true;

    const outcome = applyDiveResult(state, result);

    expect(outcome.samples).toBe(5);
    expect(outcome.data).toBe(9);
    expect(outcome.discoveries).toBe(2);
    expect(state.resources.samples).toBe(before.samples + 5);
    expect(state.resources.data).toBe(before.data + 9);
    expect(state.stats.expeditions).toBe(before.expeditions + 1);
    expect(state.rov.hull).toBe(Math.max(0, before.hull - 12));
    expect(state.rov.batteryPct).toBe(Math.max(0, before.battery - 34));
    expect(state.rov.deployed).toBe(false);
    expect(state.flags['codex.clue-vents-0']).toBe(true);
    expect(state.flags['codex.clue-vents-1']).toBe(true);
    expect(state.incidentLog[state.incidentLog.length - 1]?.text).toContain('شیرجه');
  });

  it('never double-counts the same discovery', () => {
    const state = createInitialState('campaign');
    applyDiveResult(state, result);
    const second = applyDiveResult(state, result);
    expect(second.discoveries).toBe(0);
  });

  it('keeps the ROV usable when it returns damaged but alive', () => {
    const state = createInitialState('campaign');
    applyDiveResult(state, { ...result, hullDamage: 90, batteryUsed: 70 });
    expect(state.rov.hull).toBeGreaterThanOrEqual(0);
    expect(state.rov.batteryPct).toBeGreaterThanOrEqual(0);
  });
});
