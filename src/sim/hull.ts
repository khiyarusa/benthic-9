import { ROOM_VOLUME, externalPressureMPa, roomDef } from './content';
import { Rng } from './rng';
import { clamp, mods, unitFactor } from './power';
import type { GameState, RoomId } from './types';

export interface HullFrame {
  newBreaches: RoomId[];
  pumpedPct: number;
  spreadPct: number;
}

export function breachRoom(state: GameState, room: RoomId, size: number): void {
  const target = state.rooms[room];
  target.breached = true;
  target.breachSize = clamp(Math.max(target.breachSize, size), 0.15, 1);
  target.hull = clamp(target.hull - 4 * size, 0, 100);
  target.lastIncidentAt = state.minute;
}

export function stepHull(state: GameState, dtMin: number, roomFactor: Record<RoomId, number>): HullFrame {
  const rng = new Rng(state.rngState);
  const m = mods(state);
  const newBreaches: RoomId[] = [];
  let pumpedPct = 0;

  const depth = state.depthM;
  const pExt = externalPressureMPa(depth);

  for (const room of Object.values(state.rooms)) {
    const def = roomDef(room.id);
    const rating = def.hullRatingMPa + (m.alloy ? 8 : 0);
    const ratio = pExt / rating;
    const overload = Math.max(0, ratio - 0.86);

    if (overload > 0) {
      const waterFactor = room.water > 25 ? 1.7 : 1;
      room.hull = clamp(room.hull - overload * 0.42 * dtMin * waterFactor, 0, 100);
    }

    if (!room.breached && room.hull < 58) {
      const chance = (58 - room.hull) * 0.00055 * dtMin * (0.6 + ratio);
      if (rng.chance(chance)) {
        breachRoom(state, room.id, rng.range(0.25, 0.75));
        newBreaches.push(room.id);
      }
    }

    if (room.breached) {
      const inflow = room.breachSize * 2.6 * (pExt / 55) * dtMin;
      room.water = clamp(room.water + inflow, 0, 100);

      let removed = 0;
      for (const unit of Object.values(state.equipment)) {
        if (unit.room !== room.id || unit.kind !== 'pump') continue;
        const factor = unitFactor(state, roomFactor, unit);
        removed += 1.45 * factor * dtMin;
      }
      if (removed > 0) {
        const actual = Math.min(room.water, removed);
        room.water -= actual;
        pumpedPct += actual;
      }
    }

    // Standing water wrecks equipment and eats the hull from the inside.
    if (room.water > 12) {
      for (const unit of Object.values(state.equipment)) {
        if (unit.room !== room.id) continue;
        unit.health = clamp(unit.health - (room.water - 12) * 0.0035 * dtMin, 0, 100);
        if (unit.health <= 6 && !unit.tripped) {
          unit.tripped = true;
          unit.running = false;
        }
      }
      room.hull = clamp(room.hull - (room.water - 12) * 0.004 * dtMin, 0, 100);
    }
  }

  // Flood water finds its level through every open bulkhead.
  const open = Object.values(state.rooms).filter((room) => !room.sealed);
  let spreadPct = 0;
  if (open.length > 1) {
    const totalVolume = open.reduce((sum, room) => sum + ROOM_VOLUME[room.id], 0);
    const average = open.reduce((sum, room) => sum + room.water * ROOM_VOLUME[room.id], 0) / totalVolume;
    const rate = clamp(0.09 * dtMin, 0, 0.4);
    for (const room of open) {
      const volumeShare = ROOM_VOLUME[room.id] / totalVolume;
      const transfer = (average - room.water) * rate * (0.5 + volumeShare * 2);
      room.water = clamp(room.water + transfer, 0, 100);
      spreadPct += Math.abs(transfer);
    }
  }

  for (const room of Object.values(state.rooms)) {
    if (room.water > 22) {
      for (const member of state.crew) {
        if (member.alive && member.room === room.id) {
          member.health = clamp(member.health - (room.water - 22) * 0.0075 * dtMin, 0, 100);
        }
      }
    }
    if (room.water >= 99 && room.hull <= 1 && !state.flags[`lost-${room.id}`]) {
      state.flags[`lost-${room.id}`] = true;
      state.incidentLog.push({
        minute: state.minute,
        text: `اتاق «${roomDef(room.id).label}» به‌طور کامل از دست رفت.`,
        severity: 'critical',
      });
    }
  }

  state.hullIntegrity = Object.values(state.rooms).reduce((sum, room) => sum + room.hull, 0) / 10;

  state.rngState = rng.state;
  return { newBreaches, pumpedPct, spreadPct };
}

export function stationPressureMPa(state: GameState): number {
  return externalPressureMPa(state.depthM);
}
