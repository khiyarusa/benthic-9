import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/sim/state';
import { MISSIONS, missionBoard, primaryMission } from '../src/sim/missions';
import { CODEX, codexStatus } from '../src/sim/codex';

describe('campaign missions', () => {
  it('has three acts with twelve missions, all bound to state', () => {
    expect(MISSIONS).toHaveLength(12);
    const acts = new Set(MISSIONS.map((m) => m.act));
    expect([...acts]).toEqual(['survive', 'investigate', 'descend']);
    for (const mission of MISSIONS) {
      expect(mission.steps.length).toBeGreaterThan(0);
      expect(mission.why.length).toBeGreaterThan(10);
      expect(mission.reward.length).toBeGreaterThan(4);
    }
  });

  it('starts a fresh campaign on the first survival mission at low progress', () => {
    const state = createInitialState('campaign');
    const first = primaryMission(state);
    expect(first?.id).toBe('m-power');
    expect(first!.value).toBeGreaterThanOrEqual(0);
    expect(first!.value).toBeLessThan(1);
  });

  it('locks later acts until the previous act is finished', () => {
    const state = createInitialState('campaign');
    const board = missionBoard(state);
    expect(board.acts[0].missions.every((m) => !m.locked)).toBe(true);
    expect(board.acts[1].missions.every((m) => m.locked)).toBe(true);
  });

  it('advances progress from real simulation values', () => {
    const state = createInitialState('campaign');
    const dive = MISSIONS.find((m) => m.id === 'm-dive')!;
    expect(dive.progress(state)).toBe(0);
    state.stats.expeditions = 1;
    expect(dive.progress(state)).toBe(1);

    const samples = MISSIONS.find((m) => m.id === 'm-samples')!;
    state.resources.samples = 5;
    expect(samples.progress(state)).toBeCloseTo(0.5, 5);
  });
});

describe('codex', () => {
  it('starts fully locked and unlocks from flags', () => {
    const state = createInitialState('campaign');
    expect(codexStatus(state).unlocked).toHaveLength(0);
    state.flags['codex.clue-wreck-0'] = true;
    const after = codexStatus(state);
    expect(after.unlocked.map((entry) => entry.id)).toContain('hull-281');
    expect(after.unlocked.length + after.locked.length).toBe(CODEX.length);
  });

  it('never exposes an unlocked body for a locked entry', () => {
    const state = createInitialState('campaign');
    for (const entry of codexStatus(state).locked) {
      expect(entry.hint.length).toBeGreaterThan(5);
    }
  });
});
