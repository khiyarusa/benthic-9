import { describe, expect, it } from 'vitest';
import { BenthicSimulationCore } from '../src/sim';

function runHours(core: BenthicSimulationCore, hours: number) {
  for (let minute = 0; minute < hours * 60; minute += 1) {
    if (core.state.gameOver) break;
    core.tick(1);
    if (minute % 60 === 59) {
      const s = core.state;
      // eslint-disable-next-line no-console
      console.log('[hour]', Math.round(s.minute / 60), {
        hull: Math.round(s.hullIntegrity),
        breaches: Object.values(s.rooms).filter((room) => room.breached).map((room) => room.id),
        maxWater: Math.round(Math.max(...Object.values(s.rooms).map((room) => room.water))),
        alive: s.crew.filter((member) => member.alive).length,
        hp: s.crew.map((member) => Math.round(member.health)).join('/'),
        power: `${Math.round(s.power.suppliedKW)}/${Math.round(s.power.demandKW)}`,
        o2: Math.round(s.resources.oxygenKg),
        parts: Math.round(s.resources.partsKg),
      });
    }
  }
}

describe('balance guards', () => {
  it('keeps the station survivable for the first eight hours without player input', () => {
    const core = BenthicSimulationCore.newGame('campaign', 2026);
    runHours(core, 8);
    const state = core.state;

    const alive = state.crew.filter((member) => member.alive).length;
    // eslint-disable-next-line no-console
    console.log('[balance 8h]', {
      minute: state.minute,
      alive,
      crew: state.crew.map((member) => ({ name: member.name, alive: member.alive, health: Math.round(member.health), energy: Math.round(member.energy), stress: Math.round(member.stress), room: member.room, task: member.task.kind })),
      hull: Number(state.hullIntegrity.toFixed(1)),
      water: Number((Object.values(state.rooms).reduce((sum, room) => sum + room.water, 0) / 10).toFixed(1)),
      temps: Object.fromEntries(Object.entries(state.rooms).map(([id, room]) => [id, Math.round(room.tempC)])),
      o2: Number(state.resources.oxygenKg.toFixed(1)),
      co2: Math.max(...Object.values(state.rooms).map((room) => room.co2)).toFixed(2),
      fuel: Number(state.resources.fuelKg.toFixed(1)),
      power: { capacity: Math.round(state.power.capacityKW), demand: Math.round(state.power.demandKW), supplied: Math.round(state.power.suppliedKW) },
      repairs: state.stats.repairs,
      research: state.research.completed,
      incidents: state.incidents.slice(0, 6).map((entry) => entry.title),
    });

    // The station must not collapse on its own this early: the player has time to learn.
    expect(alive).toBeGreaterThanOrEqual(3);
    expect(state.hullIntegrity).toBeGreaterThan(25);
    expect(state.resources.oxygenKg).toBeGreaterThan(10);
    expect(state.gameOver).toBe(false);
  });

  it('lets the challenge scenario be recoverable with pumping', () => {
    const core = BenthicSimulationCore.newGame('challenge', 42);
    runHours(core, 3);
    // Challenge is hard, but the corridor must be drainable rather than instantly lost.
    expect(core.state.rooms.corridor.water).toBeLessThan(100);
  });
});
