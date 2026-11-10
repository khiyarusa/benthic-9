import { ROOM_VOLUME } from './content';
import { clamp, mods, unitFactor } from './power';
import type { GameState, RoomId } from './types';

/** Air heat capacity is approximated at 1.0 kJ/kg·K, 1.2 kg per m³ at 5.8 MPa. */
const AIR_KG_PER_M3 = 1.2;
const KJ_PER_KG_K = 1.0;

export interface ThermalFrame {
  heatKW: number;
  coolingKW: number;
}

export function stepThermal(state: GameState, dtMin: number, roomFactor: Record<RoomId, number>): ThermalFrame {
  const m = mods(state);
  const rooms = Object.values(state.rooms);
  const totalVolume = rooms.reduce((sum, room) => sum + ROOM_VOLUME[room.id], 0);

  const roomHeat = {} as Record<RoomId, number>;
  for (const room of rooms) roomHeat[room.id] = 0;

  for (const unit of Object.values(state.equipment)) {
    if (!unit.running || unit.tripped || unit.health <= 0) continue;
    const factor = unitFactor(state, roomFactor, unit);
    if (factor <= 0) continue;
    if (unit.kind === 'heater' && state.rooms[unit.room].tempC >= 20) continue;
    roomHeat[unit.room] += unit.heatKW * factor;
  }

  const reactor = state.equipment['reactor-1'];
  if (reactor && !reactor.tripped && reactor.running) {
    roomHeat.reactor += 14 * state.power.reactorThrottle;
  }

  const coolantUnits = Object.values(state.equipment).filter((unit) => unit.kind === 'coolant');
  let coolingKW = 0;
  const localCooling = {} as Record<RoomId, number>;
  for (const room of rooms) localCooling[room.id] = 0;

  for (const unit of coolantUnits) {
    const factor = unitFactor(state, roomFactor, unit);
    if (factor <= 0 || state.thermal.coolantPct <= 0.5) continue;
    const capacity = 52 * factor;
    coolingKW += capacity;
    localCooling[unit.room] += capacity;
    state.thermal.coolantPct = Math.max(0, state.thermal.coolantPct - 0.012 * dtMin * factor);
  }

  // A small passive loop keeps the rest of the station habitable.
  const passiveCooling = coolingKW * 0.22;

  let totalHeat = 0;
  for (const room of rooms) {
    const volume = ROOM_VOLUME[room.id];
    const mass = volume * AIR_KG_PER_M3;
    const heat = roomHeat[room.id];
    totalHeat += heat;

    let deltaT = (heat * 60 * dtMin) / (mass * KJ_PER_KG_K);

    // heat exchange with the 4°C ocean through the hull
    const exchange = 0.055 * dtMin * (volume / 300);
    deltaT -= (room.tempC - state.thermal.ambientC) * exchange;

    // life support also runs the air handlers that even out the station temperature
    const lifeFactor = roomFactor.life ?? 0;
    if (lifeFactor > 0.2) {
      deltaT += (20 - room.tempC) * 0.02 * lifeFactor * dtMin;
    }

    const cooling = localCooling[room.id] + passiveCooling * (volume / totalVolume);
    if (cooling > 0 && room.tempC > 15) {
      const effectiveness = clamp((room.tempC - 15) / 25, 0, 1);
      deltaT -= (cooling * 60 * dtMin * effectiveness) / (mass * KJ_PER_KG_K);
    }

    room.tempC = clamp(room.tempC + deltaT, -2, 140);
  }

  state.power.reactorTempC = state.rooms.reactor.tempC;
  state.thermal.heatingDemandKW = Object.values(state.equipment)
    .filter((unit) => unit.kind === 'heater' && unit.running && !unit.tripped)
    .reduce((sum, unit) => sum + unit.powerDrawKW, 0);

  // Reactor overheat degrades the core and can trip the whole grid.
  if (state.rooms.reactor.tempC > 72) {
    const overheat = state.rooms.reactor.tempC - 72;
    for (const id of ['reactor-1', 'coolant-a', 'coolant-b']) {
      const unit = state.equipment[id];
      if (unit) unit.health = clamp(unit.health - overheat * 0.02 * dtMin, 0, 100);
    }
  }
  if (state.rooms.reactor.tempC > 96 && reactor && !reactor.tripped) {
    reactor.tripped = true;
    reactor.running = false;
    if (!state.flags.reactorMeltdownLogged) {
      state.flags.reactorMeltdownLogged = true;
      state.incidentLog.push({
        minute: state.minute,
        text: 'رآکتور به‌دلیل دمای بحرانی به‌صورت خودکار قطع شد.',
        severity: 'critical',
      });
    }
  }

  // Crew discomfort from bad temperatures.
  for (const member of state.crew) {
    if (!member.alive || !member.room) continue;
    const temp = state.rooms[member.room].tempC;
    if (temp < 6) {
      member.health -= (6 - temp) * 0.05 * dtMin;
      member.stress = clamp(member.stress + 0.12 * dtMin, 0, 100);
    } else if (temp > 35) {
      member.health -= (temp - 35) * 0.05 * dtMin;
      member.stress = clamp(member.stress + 0.15 * dtMin, 0, 100);
    }
    if (m.bioluminescence && temp >= 6 && temp <= 35) {
      member.stress = clamp(member.stress - 0.01 * dtMin, 0, 100);
    }
  }

  return { heatKW: totalHeat, coolingKW };
}
