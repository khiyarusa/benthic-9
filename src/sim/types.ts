/**
 * BENTHIC-9 — shared domain types.
 *
 * This module is intentionally free of React, Phaser and DOM dependencies so the
 * whole simulation can be executed head-less inside Vitest.
 *
 * Units
 *  - time     : game minutes (1 tick = 1 game minute)
 *  - pressure : MPa (gauge)
 *  - power    : kW / kWh
 *  - volume   : percent of a room's internal volume (0..100)
 *  - mass     : kg
 */

export type RoomId =
  | 'command'
  | 'corridor'
  | 'reactor'
  | 'life'
  | 'biolab'
  | 'geolab'
  | 'medbay'
  | 'quarters'
  | 'storage'
  | 'rov';

export type GameMode = 'campaign' | 'endless' | 'challenge';

export type Speed = 0 | 1 | 2 | 4;

export type EquipmentKind =
  | 'reactor'
  | 'o2'
  | 'scrubber'
  | 'pump'
  | 'coolant'
  | 'heater'
  | 'fabricator'
  | 'console'
  | 'lab'
  | 'medbay'
  | 'sonar'
  | 'airlock'
  | 'lights';

export interface Equipment {
  id: string;
  label: string;
  room: RoomId;
  kind: EquipmentKind;
  health: number; // 0..100
  powerDrawKW: number; // nominal draw when running
  heatKW: number; // waste heat when running
  repairParts: number; // parts needed for a full repair
  critical: boolean;
  running: boolean;
  /** set by the operator, cleared when the unit is repaired */
  tripped: boolean;
}

export interface RoomState {
  id: RoomId;
  hull: number; // 0..100 structural integrity
  water: number; // 0..100 flooding level
  tempC: number;
  o2: number; // percent of volume
  co2: number; // percent of volume
  /** commanded bulkhead state: sealed rooms do not exchange air/water */
  sealed: boolean;
  lightsOn: boolean;
  ventOpen: boolean;
  occupiedBy: string[];
  breached: boolean;
  breachSize: number; // 0..1 — controls the flooding rate
  lastIncidentAt: number;
}

export interface CrewSkills {
  engineering: number; // 1..5
  biology: number;
  geology: number;
  medical: number;
}

export type CrewTask =
  | { kind: 'repair'; equipmentId: string; progress: number }
  | { kind: 'pump'; room: RoomId }
  | { kind: 'seal'; room: RoomId; progress: number }
  | { kind: 'weld'; room: RoomId; progress: number }
  | { kind: 'research'; nodeId: string }
  | { kind: 'rest' }
  | { kind: 'idle' };

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  skills: CrewSkills;
  health: number; // 0..100
  energy: number; // 0..100
  stress: number; // 0..100
  room: RoomId | null; // null while in transit
  travelTo: RoomId | null;
  travelRemaining: number; // game minutes
  task: CrewTask;
  autoTask: boolean;
  alive: boolean;
}

export interface ResourceStock {
  fuelKg: number;
  partsKg: number;
  oxygenKg: number;
  foodKg: number;
  waterL: number;
  samples: number;
  data: number;
  scrapKg: number;
}

export interface PowerState {
  reactorThrottle: number; // 0..1 commanded output
  reactorTempC: number;
  batteryKWh: number;
  batteryCapacityKWh: number;
  demandKW: number;
  suppliedKW: number;
  brownout: boolean;
  roomPriority: Record<RoomId, number>; // 1 = highest priority, 5 = lowest
  roomFactor: Record<RoomId, number>; // delivered / demanded per room, last tick
  capacityKW: number;
}

export interface LifeSupportState {
  scrubberLoad: number; // 0..1 how hard the scrubbers work
  co2StoredKg: number;
  electrolysisEnabled: boolean;
}

export interface ThermalState {
  coolantPct: number; // remaining coolant charge
  ambientC: number;
  heatingDemandKW: number;
}

export interface ResearchState {
  completed: string[];
  activeNodeId: string | null;
  progress: number; // 0..100 of the active node
}

export interface RovState {
  deployed: boolean;
  depthM: number;
  hull: number;
  batteryPct: number;
  missionMinutesLeft: number;
  targetDepthM: number;
  samplesFound: number;
  dataFound: number;
  lastMissionResult: string | null;
}

export interface IncidentRecord {
  minute: number;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  room?: RoomId;
}

export interface LogEntry {
  minute: number;
  text: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ObjectiveState {
  id: string;
  done: boolean;
  progress: number; // 0..1
}

export interface GameStats {
  incidentsResolved: number;
  repairs: number;
  expeditions: number;
  panelsOpened: number;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  mode: GameMode;
  minute: number;
  speed: Speed;
  paused: boolean;
  depthM: number;
  hullIntegrity: number;
  rooms: Record<RoomId, RoomState>;
  equipment: Record<string, Equipment>;
  crew: CrewMember[];
  resources: ResourceStock;
  power: PowerState;
  life: LifeSupportState;
  thermal: ThermalState;
  research: ResearchState;
  rov: RovState;
  incidents: IncidentRecord[];
  incidentLog: LogEntry[];
  objectives: ObjectiveState[];
  stats: GameStats;
  gameOver: boolean;
  gameOverReason: string | null;
  victory: boolean;
  flags: Record<string, boolean>;
}

export interface RoomDefinition {
  id: RoomId;
  label: string;
  category: string;
  deck: 'upper' | 'spine' | 'lower' | 'bay';
  /** world geometry used by the Phaser cutaway scene (1920x1080 design space) */
  x: number;
  y: number;
  w: number;
  h: number;
  hullRatingMPa: number;
  volumeM3: number;
  baseTempC: number;
}

export interface ResearchNode {
  id: string;
  branch: 'structure' | 'energy' | 'life' | 'deep';
  label: string;
  description: string;
  costData: number;
  costSamples: number;
  requires: string[];
  unlocks: string;
}

export interface IncidentDefinition {
  id: string;
  title: string;
  severity: 'warning' | 'critical';
  minMinute: number;
  weight: number;
}

export interface ObjectiveDefinition {
  id: string;
  label: string;
  hint: string;
}
