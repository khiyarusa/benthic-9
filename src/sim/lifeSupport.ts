import { ROOM_VOLUME, ROOMS } from './content';
import { clamp, mods, unitFactor } from './power';
import type { GameState, RoomId } from './types';

const O2_TANK_CAPACITY = 400;

export interface LifeFrame {
  o2ProducedKg: number;
  o2ConsumedKg: number;
  scrubbedKg: number;
}

/**
 * Atmosphere model.
 *
 * Oxygen is tracked twice on purpose:
 *  - `resources.oxygenKg` is the *mass* reserve of the station (electrolysis in,
 *    breathing out). It is what the player actually manages.
 *  - `room.o2` is the *concentration* the crew experiences, which only follows
 *    the reserve when air handlers have power.
 */
export function stepLifeSupport(state: GameState, dtMin: number, roomFactor: Record<RoomId, number>): LifeFrame {
  const m = mods(state);
  const o2gen = state.equipment['o2-gen-1'];
  const genFactor = unitFactor(state, roomFactor, o2gen) * (state.life.electrolysisEnabled ? 1 : 0);
  let produced = 0;

  if (genFactor > 0 && state.resources.waterL > 0.2) {
    const efficiency = m.electrolysis ? 1.4 : 1;
    produced = 1.05 * efficiency * genFactor * dtMin;
    const waterUsed = 1.6 * genFactor * dtMin;
    state.resources.waterL = Math.max(0, state.resources.waterL - waterUsed);
    state.resources.oxygenKg = clamp(state.resources.oxygenKg + produced, 0, O2_TANK_CAPACITY);
  }

  const alive = state.crew.filter((member) => member.alive && member.room !== null);
  const demandKg = alive.length * 0.02 * dtMin;
  const consumed = Math.min(state.resources.oxygenKg, demandKg);
  state.resources.oxygenKg = Math.max(0, state.resources.oxygenKg - consumed);

  const lifeRoomFactor = roomFactor.life ?? 0;
  const circulation = clamp(0.05 + lifeRoomFactor * 0.25, 0, 1);

  const rooms = Object.values(state.rooms);
  for (const room of rooms) {
    const occupants = room.occupiedBy.length;
    if (consumed >= demandKg * 0.98) {
      room.o2 += (20.9 - room.o2) * clamp(circulation * dtMin, 0, 0.6);
    } else {
      const deficit = demandKg > 0 ? 1 - consumed / demandKg : 1;
      room.o2 -= (0.0025 + occupants * 0.02) * dtMin * (0.5 + deficit);
      if (room.sealed) room.o2 -= occupants * 0.015 * dtMin;
    }
    room.o2 = clamp(room.o2, 0, 23);

    room.co2 += (occupants * 0.022 + 0.0015) * dtMin;
  }

  const scrubber = state.equipment['scrubber-1'];
  const scrubFactor = unitFactor(state, roomFactor, scrubber) * (m.carbonScrubber ? 1.5 : 1);
  let scrubbed = 0;
  if (scrubFactor > 0) {
    for (const room of rooms) {
      const removal = Math.min(room.co2, 0.24 * scrubFactor * dtMin);
      room.co2 -= removal;
      scrubbed += removal;
    }
    state.life.scrubberLoad = scrubFactor;
  } else {
    state.life.scrubberLoad = 0;
  }
  state.life.co2StoredKg += scrubbed * 1.8;

  // Air mixing through the open bulkheads: corridor acts as the plenum.
  const open = rooms.filter((room) => !room.sealed && room.ventOpen);
  if (open.length > 1 && circulation > 0.05) {
    const totalVolume = open.reduce((sum, room) => sum + ROOM_VOLUME[room.id], 0);
    let o2Mass = 0;
    let co2Mass = 0;
    for (const room of open) {
      const volume = ROOM_VOLUME[room.id];
      o2Mass += room.o2 * volume;
      co2Mass += room.co2 * volume;
    }
    const avgO2 = o2Mass / totalVolume;
    const avgCo2 = co2Mass / totalVolume;
    const mixRate = clamp(0.12 * circulation * dtMin, 0, 0.7);
    for (const room of open) {
      room.o2 += (avgO2 - room.o2) * mixRate;
      room.co2 += (avgCo2 - room.co2) * mixRate;
    }
  }

  for (const room of rooms) room.co2 = clamp(room.co2, 0, 15);

  // The crew pays for a bad atmosphere immediately.
  for (const member of state.crew) {
    if (!member.alive || !member.room) continue;
    const room = state.rooms[member.room];
    if (room.o2 < 17) member.health -= (17 - room.o2) * 0.09 * dtMin;
    if (room.co2 > 2.2) {
      member.health -= (room.co2 - 2.2) * 0.12 * dtMin;
      member.stress = clamp(member.stress + (room.co2 - 2.2) * 0.35 * dtMin, 0, 100);
    }
    if (member.health <= 0) {
      member.health = 0;
      member.alive = false;
    }
  }

  return { o2ProducedKg: produced, o2ConsumedKg: consumed, scrubbedKg: scrubbed };
}

export function roomPressureRating(state: GameState, room: RoomId): number {
  const def = ROOMS.find((entry) => entry.id === room);
  return (def?.hullRatingMPa ?? 60) + (mods(state).alloy ? 8 : 0);
}
