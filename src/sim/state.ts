import {
  CAMPAIGN_OBJECTIVES,
  CREW,
  EQUIPMENT,
  GAME_VERSION,
  ROOMS,
  START_DEPTH_M,
} from './content';
import { hashSeed } from './rng';
import type { Equipment, GameMode, GameState, RoomId, RoomState } from './types';

function initialRoom(id: RoomId): RoomState {
  const def = ROOMS.find((room) => room.id === id);
  if (!def) throw new Error(`Unknown room ${id}`);
  return {
    id,
    hull: 100,
    water: 0,
    tempC: def.baseTempC,
    o2: 20.9,
    co2: 0.05,
    sealed: id === 'rov',
    lightsOn: true,
    ventOpen: true,
    occupiedBy: [],
    breached: false,
    breachSize: 0,
    lastIncidentAt: -9999,
  };
}

const PRIORITY: Record<RoomId, number> = {
  command: 1,
  life: 1,
  reactor: 2,
  corridor: 2,
  medbay: 3,
  quarters: 4,
  biolab: 4,
  geolab: 4,
  storage: 4,
  rov: 5,
};

export function createInitialState(mode: GameMode = 'campaign', seed = hashSeed('benthic-9')): GameState {
  const rooms = {} as Record<RoomId, RoomState>;
  for (const def of ROOMS) rooms[def.id] = initialRoom(def.id);

  const equipment: Record<string, Equipment> = {};
  for (const item of EQUIPMENT) equipment[item.id] = { ...item };

  const state: GameState = {
    version: GAME_VERSION,
    seed,
    rngState: seed >>> 0,
    mode,
    minute: 0,
    speed: 1,
    paused: true,
    depthM: START_DEPTH_M,
    hullIntegrity: 96,
    rooms,
    equipment,
    crew: CREW.map((member) => ({
      ...member,
      skills: { ...member.skills },
      task: { ...member.task },
      autoTask: true,
    })),
    resources: {
      fuelKg: 480,
      partsKg: 42,
      oxygenKg: 260,
      foodKg: 96,
      waterL: 900,
      samples: 0,
      data: 45,
      scrapKg: 30,
    },
    power: {
      reactorThrottle: 0.85,
      reactorTempC: 175,
      batteryKWh: 88,
      batteryCapacityKWh: 120,
      demandKW: 0,
      suppliedKW: 0,
      brownout: false,
      roomPriority: { ...PRIORITY },
      roomFactor: {
        command: 1,
        corridor: 1,
        reactor: 1,
        life: 1,
        biolab: 1,
        geolab: 1,
        medbay: 1,
        quarters: 1,
        storage: 1,
        rov: 1,
      },
      capacityKW: 260,
    },
    life: {
      scrubberLoad: 0,
      co2StoredKg: 0,
      electrolysisEnabled: true,
    },
    thermal: {
      coolantPct: 82,
      ambientC: 4,
      heatingDemandKW: 0,
    },
    research: {
      completed: [],
      activeNodeId: null,
      progress: 0,
    },
    rov: {
      deployed: false,
      depthM: 0,
      hull: 100,
      batteryPct: 100,
      missionMinutesLeft: 0,
      targetDepthM: 0,
      samplesFound: 0,
      dataFound: 0,
      lastMissionResult: null,
    },
    incidents: [],
    incidentLog: [],
    objectives:
      mode === 'campaign'
        ? CAMPAIGN_OBJECTIVES.map((objective) => ({ id: objective.id, done: false, progress: 0 }))
        : [],
    stats: { incidentsResolved: 0, repairs: 0, expeditions: 0, panelsOpened: 0 },
    gameOver: false,
    gameOverReason: null,
    victory: false,
    flags: {},
  };

  // The station has been running for years: nothing is brand new.
  rooms.reactor.hull = 94;
  rooms.corridor.hull = 97;
  rooms.rov.hull = 91;
  equipment['coolant-b'].health = 58;
  equipment['rov-sonar'].health = 74;

  if (mode === 'challenge') {
    rooms.corridor.water = 54;
    rooms.corridor.breached = true;
    rooms.corridor.breachSize = 0.7;
    rooms.corridor.hull = 62;
    equipment['pump-corridor-1'].health = 34;
    equipment['pump-corridor-2'].running = false;
    equipment['pump-corridor-2'].health = 22;
    state.resources.partsKg = 26;
  }

  if (mode === 'endless') {
    state.resources.partsKg = 34;
    state.resources.fuelKg = 380;
    state.flags.endless = true;
  }

  for (const member of state.crew) {
    if (member.room) rooms[member.room].occupiedBy.push(member.id);
  }

  return state;
}
