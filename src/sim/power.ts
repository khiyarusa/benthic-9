import type { GameState, RoomId } from './types';

export interface ResearchMods {
  alloy: boolean;
  autoWeld: boolean;
  modularReactor: boolean;
  smartGrid: boolean;
  electrolysis: boolean;
  carbonScrubber: boolean;
  sonarArray: boolean;
  roboticArm: boolean;
  bioluminescence: boolean;
}

export function mods(state: GameState): ResearchMods {
  const has = (id: string) => state.research.completed.includes(id);
  return {
    alloy: has('alloy'),
    autoWeld: has('auto-weld'),
    modularReactor: has('modular-reactor'),
    smartGrid: has('smart-grid'),
    electrolysis: has('electrolysis'),
    carbonScrubber: has('carbon-scrubber'),
    sonarArray: has('sonar-array'),
    roboticArm: has('robotic-arm'),
    bioluminescence: has('bioluminescence'),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function gridCapacityKW(state: GameState): number {
  const reactor = state.equipment['reactor-1'];
  const base = 260 + (mods(state).modularReactor ? 70 : 0);
  if (!reactor || reactor.tripped || !reactor.running || reactor.health <= 2) return 0;
  if (state.resources.fuelKg <= 0) return 0;
  const healthFactor = 0.35 + 0.65 * (reactor.health / 100);
  return base * healthFactor * clamp(state.power.reactorThrottle, 0, 1);
}

export function roomDemandKW(state: GameState, room: RoomId): number {
  let demand = 0;
  for (const unit of Object.values(state.equipment)) {
    if (unit.room !== room) continue;
    if (!unit.running || unit.tripped || unit.health <= 0) continue;
    demand += unit.powerDrawKW;
  }
  if (state.rooms[room].lightsOn) demand += 1.4;
  return demand;
}

export interface PowerFrame {
  capacityKW: number;
  demandKW: number;
  suppliedKW: number;
  roomFactor: Record<RoomId, number>;
  batteryCharge: number;
}

/**
 * Priority-ordered power dispatch. Rooms are served from priority 1 to 5; the
 * marginal room receives a partial factor, which is what makes brownouts feel
 * systemic instead of binary.
 */
export function dispatchPower(state: GameState, dtMin: number): PowerFrame {
  const capacity = gridCapacityKW(state);
  state.power.capacityKW = capacity;

  const roomFactor = {} as Record<RoomId, number>;
  const rooms = Object.keys(state.rooms) as RoomId[];
  let demand = 0;
  for (const room of rooms) {
    const roomDemand = roomDemandKW(state, room);
    demand += roomDemand;
    roomFactor[room] = roomDemand > 0 ? 0 : 1;
  }

  const batteryDischargeKW = clamp(state.power.batteryKWh * 60, 0, 80);
  const available = capacity + batteryDischargeKW;

  const ordered = [...rooms].sort((a, b) => {
    const pa = state.power.roomPriority[a] ?? 5;
    const pb = state.power.roomPriority[b] ?? 5;
    return pa - pb;
  });

  let remaining = available;
  let supplied = 0;
  for (const room of ordered) {
    const need = roomDemandKW(state, room);
    if (need <= 0) {
      roomFactor[room] = 1;
      continue;
    }
    const given = Math.min(need, remaining);
    remaining -= given;
    supplied += given;
    roomFactor[room] = clamp(given / need, 0, 1);
  }

  const netKW = capacity - supplied;
  if (netKW >= 0) {
    const charge = Math.min(netKW * (dtMin / 60), 40 * (dtMin / 60));
    state.power.batteryKWh = clamp(state.power.batteryKWh + charge, 0, state.power.batteryCapacityKWh);
  } else {
    const discharge = -netKW * (dtMin / 60);
    state.power.batteryKWh = clamp(state.power.batteryKWh - discharge, 0, state.power.batteryCapacityKWh);
  }

  if (state.resources.fuelKg > 0) {
    state.resources.fuelKg = Math.max(
      0,
      state.resources.fuelKg - state.power.reactorThrottle * 0.045 * dtMin,
    );
  }

  state.power.demandKW = demand;
  state.power.suppliedKW = supplied;
  state.power.roomFactor = roomFactor;
  state.power.brownout = demand > 0 && supplied < demand * 0.92;

  return { capacityKW: capacity, demandKW: demand, suppliedKW: supplied, roomFactor, batteryCharge: state.power.batteryKWh };
}

export function unitFactor(_state: GameState, roomFactor: Record<RoomId, number>, unit: { room: RoomId; running: boolean; tripped: boolean; health: number }): number {
  if (!unit.running || unit.tripped || unit.health <= 0) return 0;
  const healthFactor = 0.4 + 0.6 * (unit.health / 100);
  return clamp((roomFactor[unit.room] ?? 0) * healthFactor, 0, 1);
}
