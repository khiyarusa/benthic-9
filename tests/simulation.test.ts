import { describe, expect, it } from 'vitest';
import {
  BenthicSimulationCore,
  CREW,
  ROOMS,
  createInitialState,
  deserialize,
  externalPressureMPa,
  gridCapacityKW,
  serialize,
  stationAlerts,
} from '../src/sim';
import { startResearch } from '../src/sim/research';

function run(core: BenthicSimulationCore, minutes: number): void {
  for (let i = 0; i < minutes; i += 1) {
    if (core.state.gameOver) break;
    core.tick(1);
  }
}

describe('pressure model', () => {
  it('matches 58 MPa at 5800 m', () => {
    expect(externalPressureMPa(5800)).toBeGreaterThan(58);
    expect(externalPressureMPa(5800)).toBeLessThan(59);
  });
});

describe('initial state', () => {
  it('defines ten rooms and four crew members', () => {
    const state = createInitialState('campaign', 1234);
    expect(Object.keys(state.rooms)).toHaveLength(10);
    expect(ROOMS).toHaveLength(10);
    expect(state.crew).toHaveLength(4);
    expect(CREW).toHaveLength(4);
    expect(state.crew.every((member) => member.alive)).toBe(true);
  });

  it('starts with the lights on and a powered reactor', () => {
    const state = createInitialState('campaign', 1234);
    expect(gridCapacityKW(state)).toBeGreaterThan(150);
    expect(state.rooms.rov.sealed).toBe(true);
  });
});

describe('simulation loop', () => {
  it('keeps every value finite for an in-game day', () => {
    const core = BenthicSimulationCore.newGame('campaign', 99);
    run(core, 1440);
    const state = core.state;

    expect(Number.isFinite(state.minute)).toBe(true);
    expect(Number.isFinite(state.power.suppliedKW)).toBe(true);
    expect(Number.isFinite(state.resources.oxygenKg)).toBe(true);

    for (const room of Object.values(state.rooms)) {
      expect(Number.isFinite(room.hull)).toBe(true);
      expect(Number.isFinite(room.water)).toBe(true);
      expect(Number.isFinite(room.tempC)).toBe(true);
      expect(room.o2).toBeGreaterThan(0);
      expect(room.hull).toBeGreaterThanOrEqual(0);
      expect(room.water).toBeLessThanOrEqual(100);
    }

    for (const member of state.crew) {
      expect(member.health).toBeGreaterThanOrEqual(0);
      expect(member.health).toBeLessThanOrEqual(100);
      expect(member.energy).toBeGreaterThanOrEqual(0);
      expect(member.energy).toBeLessThanOrEqual(100);
    }
  });

  it('consumes oxygen and fuel over time', () => {
    const core = BenthicSimulationCore.newGame('campaign', 7);
    const oxygen = core.state.resources.oxygenKg;
    const fuel = core.state.resources.fuelKg;
    run(core, 120);
    expect(core.state.resources.fuelKg).toBeLessThan(fuel);
    expect(core.state.resources.oxygenKg).not.toBe(oxygen);
  });

  it('does not flood a healthy station within an hour', () => {
    const core = BenthicSimulationCore.newGame('campaign', 4242);
    run(core, 60);
    expect(core.state.rooms.corridor.water).toBeLessThan(5);
    expect(core.state.gameOver).toBe(false);
  });

  it('reports alerts when the challenge scenario starts flooded', () => {
    const state = createInitialState('challenge', 5);
    expect(state.rooms.corridor.water).toBeGreaterThan(50);
    const alerts = stationAlerts(state);
    expect(alerts.some((alert) => alert.level === 'critical')).toBe(true);
  });
});

describe('power dispatch', () => {
  it('serves high priority rooms first during a shortage', () => {
    const state = createInitialState('campaign', 11);
    state.equipment['reactor-1'].health = 100;
    state.power.reactorThrottle = 0.1;
    state.power.batteryKWh = 0;
    state.power.roomPriority.quarters = 5;
    state.power.roomPriority.life = 1;

    const core = new BenthicSimulationCore(state);
    core.tick(1);

    expect(state.power.brownout).toBe(true);
    expect(state.power.suppliedKW).toBeLessThan(state.power.demandKW);
  });

  it('cuts output when the reactor trips', () => {
    const state = createInitialState('campaign', 12);
    state.equipment['reactor-1'].tripped = true;
    expect(gridCapacityKW(state)).toBe(0);
  });
});

describe('research', () => {
  it('charges data and completes through crew work', () => {
    const core = BenthicSimulationCore.newGame('campaign', 77);
    const before = core.state.resources.data;
    expect(startResearch(core.state, 'alloy').ok).toBe(true);
    expect(core.state.resources.data).toBe(before - 40);

    run(core, 900);
    expect(core.state.research.completed.includes('alloy')).toBe(true);
  });

  it('rejects nodes without prerequisites', () => {
    const state = createInitialState('campaign', 3);
    const result = startResearch(state, 'auto-weld');
    expect(result.ok).toBe(false);
  });
});

describe('save system', () => {
  it('round-trips a state without losing the campaign', () => {
    const core = BenthicSimulationCore.newGame('campaign', 55);
    run(core, 30);
    const raw = serialize(core.state);
    const restored = deserialize(raw);
    expect(restored).not.toBeNull();
    expect(restored?.minute).toBe(core.state.minute);
    expect(restored?.crew.length).toBe(4);
    expect(restored?.resources.fuelKg).toBeCloseTo(core.state.resources.fuelKg, 5);
  });

  it('rejects corrupt payloads', () => {
    expect(deserialize('{oops')).toBeNull();
    expect(deserialize('{"version":999}')).toBeNull();
  });
});

describe('crew behaviour', () => {
  it('sends an engineer to seal a breach automatically', () => {
    const state = createInitialState('campaign', 21);
    state.rooms.storage.breached = true;
    state.rooms.storage.breachSize = 0.9;
    state.rooms.storage.hull = 40;

    const core = new BenthicSimulationCore(state);
    run(core, 40);

    const engineer = core.state.crew.find((member) => member.skills.engineering >= 3);
    expect(engineer).toBeTruthy();
    expect(core.state.rooms.storage.water).toBeGreaterThan(0);
  });
});
